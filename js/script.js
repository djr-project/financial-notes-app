document.addEventListener("DOMContentLoaded", function () {
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    const addNoteBtn = document.getElementById("addNoteBtn");
    const noteModal = document.getElementById("noteModal");
    const noteForm = document.getElementById("noteForm");
    const notesContainer = document.getElementById("notesContainer");

    function saveTransactions() {
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    function renderTransactions(filteredTransactions = transactions) {
        notesContainer.innerHTML = "";
        let totalIncome = 0, totalExpense = 0, totalBalance = 0;

        filteredTransactions.forEach((transaction, index) => {
            let color = transaction.type === "income" ? "text-green-500" : "text-red-500";

            let noteItem = document.createElement("div");
            noteItem.classList.add("p-4", "border", "rounded", "shadow");
            noteItem.setAttribute("data-date", transaction.date);
            noteItem.innerHTML = `
                <h3 class="text-lg font-semibold">${transaction.title}</h3>
                <p class="${color} text-lg font-bold">Rp ${transaction.amount}</p>
                <p class="text-sm text-gray-500">${transaction.date}</p>
                <button data-index="${index}" class="delete-btn mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Hapus</button>
            `;

            notesContainer.appendChild(noteItem);

            if (transaction.type === "income") {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });

        totalBalance = totalIncome - totalExpense;
        document.getElementById("totalIncome").textContent = `Rp ${totalIncome}`;
        document.getElementById("totalExpense").textContent = `Rp ${totalExpense}`;
        document.getElementById("totalBalance").textContent = `Rp ${totalBalance}`;

        // Tambahkan event listener untuk tombol hapus
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                let index = this.getAttribute("data-index");
                deleteTransaction(index);
            });
        });
    }

    function deleteTransaction(index) {
        transactions.splice(index, 1);
        saveTransactions();
        renderTransactions();
    }

    noteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const title = document.getElementById("title").value;
        const amount = parseFloat(document.getElementById("amount").value);
        const date = document.getElementById("date").value;
        const type = document.getElementById("type").value; // Ambil tipe transaksi dari dropdown

        transactions.push({ title, amount, date, type });
        saveTransactions();
        renderTransactions();
        noteModal.classList.add("hidden");
        noteForm.reset();
    });

    addNoteBtn.addEventListener("click", function () {
        noteModal.classList.remove("hidden");
    });

    document.getElementById("cancelBtn").addEventListener("click", function () {
        noteModal.classList.add("hidden");
    });

    // Filter Berdasarkan Jenis
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", function () {
            document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");

            const filterType = this.getAttribute("data-filter");

            if (filterType === "all") {
                renderTransactions();
            } else {
                renderTransactions(transactions.filter(trx => trx.type === filterType));
            }
        });
    });

    renderTransactions();
});
