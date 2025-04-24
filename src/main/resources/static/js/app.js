// Global variables
let products = [];
let modal = null;
let confirmModal = null;
let transactionModal = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap modals
    modal = new bootstrap.Modal(document.getElementById('productModal'));
    confirmModal = new bootstrap.Modal(document.getElementById('confirmModal'));
    transactionModal = new bootstrap.Modal(document.getElementById('transactionModal'));

    // Load all products
    loadProducts();

    // Check for low stock every 30 seconds
    setInterval(checkLowStock, 30000);


});

document.addEventListener('DOMContentLoaded', function () {

});

function updateTransactionTotal() {
    const totals = Array.from(document.querySelectorAll('.transaction-total')).map(el => {
        return parseFloat(el.textContent.replace('$', ''));
    });

    const sum = totals.reduce((acc, val) => acc + val, 0);
    document.getElementById('transactionTotal').textContent = `$${sum.toFixed(2)}`;
}

function removeTransactionItem(button) {
    button.closest('tr').remove();
    updateTransactionTotal();
}

function showTransactionModal() {
    // Load products for the dropdown
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('productSelect');
            select.innerHTML = '<option value="">Select Product</option>';

            data.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${product.stockQuantity} in stock)`;
                select.appendChild(option);
            });

            // Clear previous transaction items
            document.getElementById('transactionItems').innerHTML = '';
            document.getElementById('transactionTotal').textContent = '$0.00';

            transactionModal.show();
        })
        .catch(error => console.error('Error loading products:', error));
}

// Load all products from the API
function loadProducts() {
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            products = data;
            renderTable(data);
            checkLowStock();
        })
        .catch(error => console.error('Error loading products:', error));
}

// Render the table with product data
function renderTable(products) {
    const tableBody = document.getElementById('inventoryTable');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td class="${product.stockQuantity < (product.reorderThreshold || 10) ? 'low-stock' : ''}">
                <input type="number" class="form-control stock-input"
                       value="${product.stockQuantity}"
                       onchange="updateStock(${product.id}, this.value)">
            </td>
            <td>${product.sku || '-'}</td>
            <td>${product.supplier || '-'}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id}, event)">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${product.id}, event)">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Show modal for adding a new product
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    modal.show();
}

function addProductToTransaction() {
    const productId = document.getElementById('productSelect').value;
    const quantity = parseInt(document.getElementById('transactionQuantity').value);

    if (!productId || isNaN(quantity) || quantity <= 0) return;

    const product = products.find(p => p.id == productId);
    if (!product) return;

    if (quantity > product.stockQuantity) {
        alert('Not enough stock available');
        return;
    }

    const transactionItems = document.getElementById('transactionItems');
    const existingItem = transactionItems.querySelector(`tr[data-product-id="${productId}"]`);

    if (existingItem) {
        // Update existing item
        const currentQty = parseInt(existingItem.querySelector('.transaction-qty').textContent);
        const newQty = currentQty + quantity;
        existingItem.querySelector('.transaction-qty').textContent = newQty;
        existingItem.querySelector('.transaction-total').textContent = `$${(newQty * product.price).toFixed(2)}`;
    } else {
        // Add new item
        const row = document.createElement('tr');
        row.setAttribute('data-product-id', productId);
        row.innerHTML = `
            <td>${product.name}</td>
            <td class="transaction-qty">${quantity}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td class="transaction-total">$${(quantity * product.price).toFixed(2)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="removeTransactionItem(this)">Remove</button></td>
        `;
        transactionItems.appendChild(row);
    }

    updateTransactionTotal();
}


// Edit product - populate modal with product data
function editProduct(id, event) {
    event.stopPropagation();

    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description || '';
    document.getElementById('category').value = product.category;
    document.getElementById('price').value = product.price;
    document.getElementById('stockQuantity').value = product.stockQuantity;
    document.getElementById('sku').value = product.sku || '';
    document.getElementById('supplier').value = product.supplier || '';
    document.getElementById('reorderThreshold').value = product.reorderThreshold || 10;

    modal.show();
}

// Save product (create or update)
function saveProduct() {
    const productId = document.getElementById('productId').value;
    const product = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        stockQuantity: parseInt(document.getElementById('stockQuantity').value),
        sku: document.getElementById('sku').value,
        supplier: document.getElementById('supplier').value,
        reorderThreshold: parseInt(document.getElementById('reorderThreshold').value)
    };

    const url = productId ? `/api/products/${productId}` : '/api/products';
    const method = productId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(() => {
        modal.hide();
        loadProducts();
    })
    .catch(error => {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
    });
}

// Update stock quantity
function updateStock(id, newStock) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    if (isNaN(newStock) || newStock < 0) {
        alert('Please enter a valid stock quantity');
        return;
    }

    const updatedProduct = { ...product, stockQuantity: parseInt(newStock) };

    fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedProduct)
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(() => {
        loadProducts();
    })
    .catch(error => {
        console.error('Error updating stock:', error);
        alert('Error updating stock. Please try again.');
    });
}

// Confirm before deleting a product
function confirmDelete(id, event) {
    event.stopPropagation();

    document.getElementById('confirmMessage').textContent = 'Are you sure you want to delete this product?';
    document.getElementById('confirmButton').onclick = function() {
        deleteProduct(id);
        confirmModal.hide();
    };

    confirmModal.show();
}

// Delete product
function deleteProduct(id) {
    fetch(`/api/products/${id}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        loadProducts();
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please try again.');
    });
}

// Search products by name
function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    if (searchTerm === '') {
        loadProducts();
        return;
    }

    fetch(`/api/products/search?name=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => renderTable(data))
        .catch(error => console.error('Error searching products:', error));
}

// Filter products by category
function filterByCategory() {
    const category = document.getElementById('categoryFilter').value;
    if (category === '') {
        loadProducts();
        return;
    }

    fetch(`/api/products/category/${category}`)
        .then(response => response.json())
        .then(data => renderTable(data))
        .catch(error => console.error('Error filtering products:', error));
}

// Check for low stock items
function checkLowStock() {
    fetch('/api/products/low-stock')
        .then(response => response.json())
        .then(lowStockProducts => {
            const alertDiv = document.getElementById('lowStockAlert');
            if (lowStockProducts.length > 0) {
                alertDiv.classList.remove('d-none');
            } else {
                alertDiv.classList.add('d-none');
            }
        })
        .catch(error => console.error('Error checking low stock:', error));
}

// Show only low stock items
function showLowStock() {
    fetch('/api/products/low-stock')
        .then(response => response.json())
        .then(data => renderTable(data))
        .catch(error => console.error('Error loading low stock products:', error));
}

function processTransaction() {
    const items = Array.from(document.getElementById('transactionItems').children).map(row => {
        return {
            productId: row.getAttribute('data-product-id'),
            quantity: parseInt(row.querySelector('.transaction-qty').textContent)
        };
    });

    if (items.length === 0) {
        alert('Please add at least one product to the transaction');
        return;
    }

    fetch('/api/transactions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(() => {
        transactionModal.hide();
        loadProducts();
        alert('Transaction processed successfully!');
    })
    .catch(error => {
        console.error('Error processing transaction:', error);
        alert('Error processing transaction. Please try again.');
    });
}

