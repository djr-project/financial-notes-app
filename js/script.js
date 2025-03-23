document.addEventListener('DOMContentLoaded', async () => {
    const addNoteBtn = document.getElementById('addNoteBtn');
    const noteModal = document.getElementById('noteModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const noteForm = document.getElementById('noteForm');
    const notesContainer = document.getElementById('notesContainer');

    let db;
    let fileHandle, fileStream;

    async function initDB() {
        try {
            const SQL = await initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/${file}` });

            // Cek apakah browser mendukung OPFS
            if (!navigator.storage || !navigator.storage.getDirectory) {
                alert("Browser tidak mendukung OPFS! Gunakan Chrome atau Edge terbaru.");
                return;
            }

            fileHandle = await navigator.storage.getDirectory();
            fileHandle = await fileHandle.getFileHandle('financial_notes.db', { create: true });

            try {
                const file = await fileHandle.getFile();
                const buffer = await file.arrayBuffer();
                db = new SQL.Database(new Uint8Array(buffer));
            } catch (error) {
                db = new SQL.Database();
                db.run("CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, amount REAL, date TEXT)");
                await saveDB();
            }

            renderNotes();
        } catch (error) {
            console.error("Error initializing database:", error);
        }
    }

    async function saveDB() {
        try {
            const data = db.export();
            fileStream = await fileHandle.createWritable();
            await fileStream.write(data);
            await fileStream.close();
        } catch (error) {
            console.error("Error saving database:", error);
        }
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
        const amount = parseFloat(document.getElementById('amount').value);
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
        let totalIncome = 0, totalExpense = 0;

        while (stmt.step()) {
            const note = stmt.getAsObject();
            const noteElement = document.createElement('div');
            noteElement.classList.add('bg-white', 'p-4', 'rounded', 'shadow');
            noteElement.innerHTML = `
                <h3 class="text-lg font-bold">${note.title}</h3>
                <p class="text-gray-700">Amount: Rp ${note.amount.toLocaleString()}</p>
                <p class="text-gray-700">Date: ${note.date}</p>
                <button class="bg-red-500 text-white px-2 py-1 rounded mt-2" onclick="deleteNote(${note.id})">Delete</button>
            `;
            notesContainer.appendChild(noteElement);

            if (note.amount > 0) totalIncome += note.amount;
            else totalExpense += note.amount;
        }

        stmt.free();

        document.getElementById("totalIncome").textContent = `Rp ${totalIncome.toLocaleString()}`;
        document.getElementById("totalExpense").textContent = `Rp ${Math.abs(totalExpense).toLocaleString()}`;
        document.getElementById("totalBalance").textContent = `Rp ${(totalIncome + totalExpense).toLocaleString()}`;
    }

    window.deleteNote = async (id) => {
        db.run("DELETE FROM notes WHERE id = ?", [id]);
        await saveDB();
        renderNotes();
    };

    await initDB();
});
