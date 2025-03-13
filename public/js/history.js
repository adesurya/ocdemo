/**
 * History page functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const rows = document.querySelectorAll('.test-row');
    const noResults = document.getElementById('noResults');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            let foundResults = false;
            
            rows.forEach(row => {
                const testCaseName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                
                if (testCaseName.includes(searchTerm)) {
                    row.style.display = '';
                    foundResults = true;
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Show/hide no results message
            if (noResults) {
                noResults.style.display = foundResults ? 'none' : 'block';
            }
        });
    }
    
    // Filter by type
    const typeFilters = document.querySelectorAll('.test-filter');
    
    typeFilters.forEach(filter => {
        filter.addEventListener('change', function() {
            const type = this.getAttribute('data-type');
            const isChecked = this.checked;
            
            rows.forEach(row => {
                const rowType = row.getAttribute('data-type');
                
                if (rowType === type) {
                    row.style.display = isChecked ? '' : 'none';
                }
            });
            
            // Check if any results are visible
            let anyVisible = false;
            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    anyVisible = true;
                }
            });
            
            // Show/hide no results message
            if (noResults) {
                noResults.style.display = anyVisible ? 'none' : 'block';
            }
        });
    });
    
    // Add confirmation to all delete forms
    // document.querySelectorAll('form[action*="DELETE"]').forEach(form => {
    //     form.addEventListener('submit', function(e) {
    //         const confirmMessage = 'Are you sure you want to delete this item? This action cannot be undone.';
    //         if (!confirm(confirmMessage)) {
    //             e.preventDefault();
    //         }
    //     });
    // });
    
    // Function to download comparison JSON
    window.downloadComparison = function(id) {
        fetch(`/api/comparison/${id}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Create JSON file and download
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `comparison-${id}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    alert('Failed to download comparison data: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Error downloading comparison:', error);
                alert('Failed to download comparison data');
            });
    };
    
    // Helper functions
    window.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    window.formatDate = function(date) {
        if (!date) return '';
        return new Date(date).toLocaleString('id-ID');
    };
});