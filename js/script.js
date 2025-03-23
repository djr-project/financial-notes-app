document.addEventListener('DOMContentLoaded', async () => {
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const noteForm = document.getElementById('noteForm');
    const notesContainer = document.getElementById('notesContainer');

    let db;

    async function initDB() {
        const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
        db = new SQL.Database();
        db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT)");
        renderNotes();
    }

    addNoteBtn.addEventListener('click', () => {
        noteModal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        noteModal.classList.add('hidden');
    });

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        db.run("INSERT INTO notes (title, amount, date) VALUES (?, ?, ?)", [title, amount, date]);
        renderNotes();
        noteModal.classList.add('hidden');
        noteForm.reset();
    });

    function renderNotes() {
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

    window.deleteNote = (id) => {
        db.run("DELETE FROM notes WHERE id = ?", [id]);
        renderNotes();
    };

    await initDB();
});
