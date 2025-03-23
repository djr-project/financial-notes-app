document.addEventListener('DOMContentLoaded', async () => {
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const noteForm = document.getElementById('noteForm');
    const notesContainer = document.getElementById('notesContainer');

    let db;
    let SQL;
    
    async function initDB() {
        SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });

        // Gunakan OPFS untuk menyimpan database secara persisten
        if (!window.showDirectoryPicker) {
            alert("Browser Anda tidak mendukung OPFS. Coba gunakan Chrome atau Edge terbaru.");
            return;
        }

        const root = await navigator.storage.getDirectory();
        const dbFile = await root.getFileHandle("financial-notes.sqlite", { create: true });
        const writableStream = await dbFile.createWritable();

        // Cek apakah ada database lama yang bisa dimuat
        const file = await dbFile.getFile();
        if (file.size > 0) {
            const buffer = await file.arrayBuffer();
            db = new SQL.Database(new Uint8Array(buffer));
        } else {
            db = new SQL.Database();
            db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT)");
            await saveDB();
        }

        renderNotes();
    }

    async function saveDB() {
        const root = await navigator.storage.getDirectory();
        const dbFile = await root.getFileHandle("financial-notes.sqlite", { create: true });
        const writableStream = await dbFile.createWritable();
        const buffer = db.export();
        await writableStream.write(buffer);
        await writableStream.close();
    }

    addNoteBtn.addEventListener('click', () => {
        noteModal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        noteModal.classList.add('hidden');
    });

    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        db.run("INSERT INTO notes (title, amount, date) VALUES (?, ?, ?)", [title, amount, date]);
        await saveDB();
        renderNotes();
        noteModal.classList.add('hidden');
        noteForm.reset();
    });

    async function renderNotes() {
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

    window.deleteNote = async (id) => {
        db.run("DELETE FROM notes WHERE id = ?", [id]);
        await saveDB();
        renderNotes();
    };

    await initDB();
});
