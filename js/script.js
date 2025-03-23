// Menggunakan SQLite dengan OPFS untuk penyimpanan lokal
import initSqlJs from 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/sql-wasm.js';
import { SQLiteFS } from 'https://cdn.jsdelivr.net/npm/wa-sqlite@1.1.0/dist/wa-sqlite.js';

let db;

async function initDB() {
    const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.1/${file}` });
    
    // Inisialisasi OPFS untuk penyimpanan persisten
    const sqliteFS = new SQLiteFS(SQL.FS, new SQL.FS.IndexedDBBackend());
    SQL.register_for_idb(sqliteFS);
    SQL.FS.mkdir('/persistent');
    SQL.FS.mount(sqliteFS, {}, '/persistent');

    // Load atau buat database di OPFS
    const dbFile = '/persistent/financial_notes.db';
    try {
        db = new SQL.Database(SQL.FS.readFile(dbFile));
    } catch (e) {
        db = new SQL.Database();
        db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, title TEXT, amount REAL, date TEXT)");
        SQL.FS.writeFile(dbFile, db.export());
    }
}

// Fungsi untuk menambahkan catatan
function addNote(title, amount, date) {
    db.run("INSERT INTO notes (title, amount, date) VALUES (?, ?, ?)", [title, amount, date]);
    saveDB();
    renderNotes();
}

// Fungsi untuk menampilkan catatan
function renderNotes() {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = '';
    
    const stmt = db.prepare("SELECT * FROM notes");
    while (stmt.step()) {
        const note = stmt.getAsObject();
        const noteElement = document.createElement('div');
        noteElement.classList.add('bg-white', 'p-4', 'rounded', 'shadow');
        noteElement.innerHTML = `
            <h3 class="text-lg font-bold">${note.title}</h3>
            <p class="text-gray-700">Amount: $${note.amount}</p>
            <p class="text-gray-700">Date: ${note.date}</p>
            <button class="bg-red-500 text-white px-2 py-1 rounded mt-2" onclick="deleteNote(${note.id})">Delete</button>
        `;
        notesContainer.appendChild(noteElement);
    }
    stmt.free();
}

// Fungsi untuk menghapus catatan
function deleteNote(id) {
    db.run("DELETE FROM notes WHERE id = ?", [id]);
    saveDB();
    renderNotes();
}

// Simpan perubahan ke OPFS
function saveDB() {
    const dbFile = '/persistent/financial_notes.db';
    SQL.FS.writeFile(dbFile, db.export());
}

// Event listener untuk form
document.getElementById('noteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    addNote(title, amount, date);
    document.getElementById('noteModal').classList.add('hidden');
    document.getElementById('noteForm').reset();
});

// Inisialisasi database saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    renderNotes();
});
