import localforage from 'localforage';
import { Card, Deck, ReviewLog } from '../types';

// Declare sql.js types globally as they are loaded via script tag
declare global {
  interface Window {
    initSqlJs: (config: any) => Promise<any>;
  }
}

const DB_NAME = 'flashmind_db';
const DB_KEY = 'sqlite_db_file';

class DatabaseService {
  private db: any = null;
  private isReady: boolean = false;

  async init() {
    if (this.isReady) return;

    try {
      const SQL = await window.initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
      });

      // Try to load saved DB from IndexedDB
      const savedDb = await localforage.getItem<Uint8Array>(DB_KEY);

      if (savedDb) {
        this.db = new SQL.Database(savedDb);
      } else {
        this.db = new SQL.Database();
        this.createTables();
        this.save();
      }

      // Enable foreign keys for cascading deletes
      this.db.run("PRAGMA foreign_keys = ON;");

      // MIGRATION: Attempt to add description column if it doesn't exist
      // sql.js doesn't have "IF COLUMN EXISTS", so we try/catch the alter table
      try {
        this.db.run("ALTER TABLE decks ADD COLUMN description TEXT;");
        await this.save();
      } catch (e) {
        // Column likely already exists, ignore error
      }

      this.isReady = true;
    } catch (e) {
      console.error("Failed to initialize database", e);
      throw e;
    }
  }

  private createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deck_id INTEGER NOT NULL,
        front_text TEXT,
        front_image BLOB,
        back_text TEXT,
        back_image BLOB,
        created_at INTEGER NOT NULL,
        next_review_due INTEGER NOT NULL,
        interval INTEGER DEFAULT 0,
        ease_factor REAL DEFAULT 2.5,
        reviews INTEGER DEFAULT 0,
        FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        reviewed_at INTEGER NOT NULL,
        FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
      );
    `);
  }

  private async save() {
    if (!this.db) return;
    const data = this.db.export();
    await localforage.setItem(DB_KEY, data);
  }

  // --- Helpers for Import/Export ---

  private u8ToBase64(u8: Uint8Array): string {
    const CHUNK_SIZE = 8192;
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i += CHUNK_SIZE) {
      const chunk = u8.subarray(i, Math.min(i + CHUNK_SIZE, len));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return window.btoa(binary);
  }

  private base64ToU8(base64: string): Uint8Array {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  // --- Decks ---

  async getDecks(): Promise<Deck[]> {
    if (!this.db) await this.init();
    // Updated query to include description
    const result = this.db.exec(`
      SELECT 
        d.id, d.name, d.description, d.created_at,
        (SELECT COUNT(*) FROM cards WHERE deck_id = d.id) as card_count,
        (SELECT COUNT(*) FROM cards WHERE deck_id = d.id AND next_review_due <= ?) as due_count,
        (SELECT COUNT(*) FROM cards WHERE deck_id = d.id AND reviews = 0) as new_count,
        (SELECT COUNT(*) FROM cards WHERE deck_id = d.id AND reviews > 0) as learned_count
      FROM decks d ORDER BY d.created_at DESC
    `, [Date.now()]);

    if (result.length === 0) return [];
    
    const columns = result[0].columns;
    const values = result[0].values;

    return values.map((v: any[]) => {
      const deck: any = {};
      columns.forEach((col: string, i: number) => {
        deck[col] = v[i];
      });
      return deck as Deck;
    });
  }

  async createDeck(name: string, description: string = ""): Promise<number> {
    if (!this.db) await this.init();
    this.db.run("INSERT INTO decks (name, description, created_at) VALUES (?, ?, ?)", [name, description, Date.now()]);
    const result = this.db.exec("SELECT last_insert_rowid()");
    const id = result[0].values[0][0] as number;
    await this.save();
    return id;
  }

  async deleteDeck(id: number) {
    if (!this.db) await this.init();
    this.db.run("DELETE FROM decks WHERE id = ?", [id]);
    await this.save();
  }

  // --- Export / Import ---

  async exportDeck(id: number): Promise<string> {
    if (!this.db) await this.init();
    
    // Get Deck Info including description
    const deckRes = this.db.exec("SELECT name, description FROM decks WHERE id = ?", [id]);
    if (!deckRes.length || !deckRes[0].values.length) throw new Error("Deck not found");
    const deckRow = deckRes[0].values[0];
    const deckName = deckRow[0];
    const deckDesc = deckRow[1];

    // Get Cards
    const cards = await this.getCards(id);
    
    const exportData = {
      name: deckName,
      description: deckDesc || "",
      version: 1,
      exported_at: Date.now(),
      cards: cards.map(c => ({
        front_text: c.front_text,
        back_text: c.back_text,
        front_image: c.front_image ? this.u8ToBase64(c.front_image) : null,
        back_image: c.back_image ? this.u8ToBase64(c.back_image) : null,
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  async importDeck(jsonContent: string): Promise<void> {
    if (!this.db) await this.init();
    
    let data;
    try {
      data = JSON.parse(jsonContent);
    } catch (e) {
      throw new Error("Ungültiges Dateiformat");
    }

    if (!data.name || !Array.isArray(data.cards)) {
      throw new Error("Ungültige Stapel-Daten");
    }

    // Create new deck with suffix to avoid confusion
    const deckId = await this.createDeck(`${data.name} (Import)`, data.description || "");

    const stmt = this.db.prepare(`
      INSERT INTO cards (
        deck_id, front_text, front_image, back_text, back_image, 
        created_at, next_review_due, interval, ease_factor, reviews
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    
    try {
      this.db.exec("BEGIN TRANSACTION");
      for (const card of data.cards) {
        stmt.run([
          deckId,
          card.front_text || '',
          card.front_image ? this.base64ToU8(card.front_image) : null,
          card.back_text || '',
          card.back_image ? this.base64ToU8(card.back_image) : null,
          now,
          now, // Due immediately
          0,
          2.5,
          0
        ]);
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      stmt.free();
      throw e;
    } 
    
    stmt.free();
    await this.save();
  }

  // --- Cards ---

  async getCards(deckId: number): Promise<Card[]> {
    if (!this.db) await this.init();
    const result = this.db.exec("SELECT * FROM cards WHERE deck_id = ?", [deckId]);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((v: any[]) => {
      const card: any = {};
      columns.forEach((col: string, i: number) => {
        card[col] = v[i];
      });
      return card as Card;
    });
  }

  async getDueCards(deckId: number): Promise<Card[]> {
    if (!this.db) await this.init();
    const now = Date.now();
    const result = this.db.exec("SELECT * FROM cards WHERE deck_id = ? AND next_review_due <= ? ORDER BY next_review_due ASC", [deckId, now]);
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map((v: any[]) => {
      const card: any = {};
      columns.forEach((col: string, i: number) => {
        card[col] = v[i];
      });
      return card as Card;
    });
  }

  async createCard(card: Partial<Card>) {
    if (!this.db) await this.init();
    const stmt = this.db.prepare(`
      INSERT INTO cards (
        deck_id, front_text, front_image, back_text, back_image, 
        created_at, next_review_due, interval, ease_factor, reviews
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run([
      card.deck_id,
      card.front_text || '',
      card.front_image || null,
      card.back_text || '',
      card.back_image || null,
      Date.now(),
      Date.now(), // Due immediately
      0,
      2.5,
      0
    ]);
    stmt.free();
    await this.save();
  }

  async updateCard(card: Card) {
     if (!this.db) await this.init();
     const stmt = this.db.prepare(`
        UPDATE cards SET 
        front_text = ?, front_image = ?, back_text = ?, back_image = ?
        WHERE id = ?
     `);
     stmt.run([
         card.front_text,
         card.front_image || null,
         card.back_text,
         card.back_image || null,
         card.id
     ]);
     stmt.free();
     await this.save();
  }

  async deleteCard(id: number) {
      if (!this.db) await this.init();
      this.db.run("DELETE FROM cards WHERE id = ?", [id]);
      await this.save();
  }

  // --- Spaced Repetition Logic (SM-2 Inspired) ---
  
  async reviewCard(cardId: number, rating: number) {
    // Rating: 1 = Again (Fail), 2 = Hard, 3 = Good, 4 = Easy
    if (!this.db) await this.init();

    // Get current card state
    const result = this.db.exec("SELECT * FROM cards WHERE id = ?", [cardId]);
    if (result.length === 0) return;
    
    const columns = result[0].columns;
    const values = result[0].values[0];
    const card: any = {};
    columns.forEach((col: string, i: number) => card[col] = values[i]);

    let { interval, ease_factor, reviews } = card;
    const now = Date.now();

    // SM-2 Algorithm Implementation
    if (rating === 1) {
      interval = 0; // Reset interval on fail
      // ease_factor stays same or decreases slightly? SM-2 says EF doesn't change on fail in some variations, but let's decrease slightly to be punitive
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    } else {
      if (reviews === 0) {
        // First successful review
        interval = 1;
      } else if (reviews === 1) {
        // Second successful review
        interval = 6;
      } else {
        // Subsequent reviews
        interval = Math.round(interval * ease_factor);
      }

      // Update Ease Factor
      // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
      // Mapping our 1-4 scale to SM-2's 0-5 scale roughly:
      // Our 1 (Again) -> 0 (Fail)
      // Our 2 (Hard) -> 3 (Pass with difficulty)
      // Our 3 (Good) -> 4 (Pass)
      // Our 4 (Easy) -> 5 (Perfect)
      
      let q = 0;
      if (rating === 2) q = 3;
      if (rating === 3) q = 4;
      if (rating === 4) q = 5;

      ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      if (ease_factor < 1.3) ease_factor = 1.3;
    }

    const next_review_due = now + (interval * 24 * 60 * 60 * 1000);

    // Update DB
    const stmt = this.db.prepare(`
      UPDATE cards SET 
        next_review_due = ?, 
        interval = ?, 
        ease_factor = ?, 
        reviews = reviews + 1
      WHERE id = ?
    `);
    
    stmt.run([next_review_due, interval, ease_factor, cardId]);
    stmt.free();

    // Log review
    this.db.run("INSERT INTO logs (card_id, rating, reviewed_at) VALUES (?, ?, ?)", [cardId, rating, now]);

    await this.save();
  }
}

export const db = new DatabaseService();