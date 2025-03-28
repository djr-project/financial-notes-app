document.addEventListener("DOMContentLoaded", function () {
    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let editIndex = null; // Menyimpan indeks transaksi yang sedang diedit

    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredTransactions = transactions.filter(transaction =>
            transaction.title.toLowerCase().includes(searchTerm)
        );
        renderTransactions(filteredTransactions);
    });

    const addNoteBtn = document.getElementById("addNoteBtn");
    const noteModal = document.getElementById("noteModal");
    const noteForm = document.getElementById("noteForm");
    const notesContainer = document.getElementById("notesContainer");
    const amountInput = document.getElementById("amount");
    amountInput.addEventListener("input", function (e) {
        let cursorPosition = amountInput.selectionStart;
        let angka = amountInput.value.replace(/[^0-9]/g, ""); // Hanya angka
        let formattedValue = formatRupiah(angka);
    
        amountInput.value = formattedValue;
    
        let newCursorPosition = formattedValue.length - (angka.length - cursorPosition);
        amountInput.setSelectionRange(newCursorPosition, newCursorPosition);
    });
    

    const yearFilter = document.getElementById("yearFilter");
    const monthFilter = document.getElementById("monthFilter");

    const sidebar = document.getElementById("sidebar");
    const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
    const closeSidebarBtn = document.getElementById("closeSidebar");

    function saveTransactions() {
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    function formatRupiah(angka) {
        let numberString = angka.toString().replace(/[^0-9]/g, ""); // Hanya angka
        return numberString ? "Rp " + parseInt(numberString).toLocaleString("id-ID") : "";
    }

    function unformatRupiah(rupiahString) {
        return parseInt(rupiahString.replace(/[^0-9]/g, "")) || 0;
    }

    function renderTransactions(filteredTransactions = transactions) {
        notesContainer.innerHTML = "";
        let totalIncome = 0, totalExpense = 0, totalBalance = 0;
    
        filteredTransactions.forEach((transaction, index) => {
            let color = transaction.type === "income" ? "text-green-500" : "text-red-500";
    
            let noteItem = document.createElement("div");
            noteItem.classList.add("note-item");
    
            noteItem.innerHTML = `
                <div class="note-content">
                    <h3 class="text-lg font-semibold">${transaction.title}</h3>
                    <p class="${color} text-lg font-bold">${formatRupiah(transaction.amount)}</p>
                    <p class="text-sm text-gray-500">${transaction.date}</p>
                </div>
                <div class="note-actions">
                    <button data-index="${index}" class="edit-btn bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Edit</button>
                    <button data-index="${index}" class="delete-btn bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Hapus</button>
                </div>
            `;
    
            notesContainer.appendChild(noteItem);
    
            if (transaction.type === "income") {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
    
        totalBalance = totalIncome - totalExpense;
        document.getElementById("totalIncome").textContent = formatRupiah(totalIncome);
        document.getElementById("totalExpense").textContent = formatRupiah(totalExpense);
        document.getElementById("totalBalance").textContent = formatRupiah(totalBalance);
    
        document.querySelectorAll(".edit-btn").forEach(button => {
            button.addEventListener("click", function () {
                let index = this.getAttribute("data-index");
                editTransaction(index);
            });
        });
    
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                let index = this.getAttribute("data-index");
                deleteTransaction(index);
            });
        });
    }
    

    function deleteTransaction(index) {
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: "Anda akan menghapus catatan ini.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                transactions.splice(index, 1);
                saveTransactions();
                renderTransactions();
            }
        });
    }


    function editTransaction(index) {
        editIndex = index;
        const transaction = transactions[index];
    
        document.getElementById("title").value = transaction.title;
        document.getElementById("amount").value = formatRupiah(transaction.amount.toString());
        document.getElementById("date").value = transaction.date;
        document.getElementById("type").value = transaction.type;
    
        noteModal.classList.remove("hidden");
    }

    // Populasi dropdown tahun dan bulan
    function populateDateFilters() {
        const currentYear = new Date().getFullYear();
        const years = [];

        // Menambahkan tahun-tahun yang tersedia
        for (let i = currentYear; i >= currentYear - 5; i--) {
            years.push(i);
        }

        // Isi dropdown tahun
        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Isi dropdown bulan
        const months = [
            "Januari", "Februari", "Maret", "April", "Mei", "Juni",
            "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        months.forEach((month, index) => {
            const option = document.createElement("option");
            option.value = index + 1; // Bulan dimulai dari 1 (Januari)
            option.textContent = month;
            monthFilter.appendChild(option);
        });
    }

    // Filter transaksi berdasarkan tahun dan bulan
    function filterTransactions() {
        const selectedYear = yearFilter.value;
        const selectedMonth = monthFilter.value;

        let filteredTransactions = transactions;

        if (selectedYear !== "all") {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const transactionYear = new Date(transaction.date).getFullYear();
                return transactionYear == selectedYear;
            });
        }

        if (selectedMonth !== "all") {
            filteredTransactions = filteredTransactions.filter(transaction => {
                const transactionMonth = new Date(transaction.date).getMonth() + 1; // Bulan dimulai dari 0
                return transactionMonth == selectedMonth;
            });
        }

        renderTransactions(filteredTransactions);
    }

    // Populasi dropdown tahun dan bulan
    populateDateFilters();

    // Set event listener untuk filter tahun dan bulan
    yearFilter.addEventListener("change", filterTransactions);
    monthFilter.addEventListener("change", filterTransactions);

    // Toggle sidebar visibility
    toggleSidebarBtn.addEventListener("click", function() {
        sidebar.classList.toggle("open");
    });

    closeSidebarBtn.addEventListener("click", function() {
        sidebar.classList.remove("open");
    });
    

    noteForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const title = document.getElementById("title").value;
        const amount = unformatRupiah(amountInput.value);
        const date = document.getElementById("date").value;
        const type = document.getElementById("type").value;
    
        if (editIndex !== null) {
            // Jika sedang mengedit, update data transaksi
            transactions[editIndex] = { title, amount, date, type };
            editIndex = null;
        } else {
            // Jika tidak, tambahkan transaksi baru
            transactions.unshift({ title, amount, date, type });
        }
    
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
