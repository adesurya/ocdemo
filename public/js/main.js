document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle (if exists)
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Elements
    const form = document.getElementById('comparison-form');
    const testCaseInput = document.getElementById('testCase');
    const hpuxDropzone = document.getElementById('hpuxDropzone');
    const linuxDropzone = document.getElementById('linuxDropzone');
    const hpuxInput = document.getElementById('hpuxImage');
    const linuxInput = document.getElementById('linuxImage');
    const hpuxPreview = document.getElementById('hpuxPreview');
    const linuxPreview = document.getElementById('linuxPreview');
    const hpuxPreviewImage = document.getElementById('hpuxPreviewImage');
    const linuxPreviewImage = document.getElementById('linuxPreviewImage');
    const removeHpuxButton = document.getElementById('removeHpuxImage');
    const removeLinuxButton = document.getElementById('removeLinuxImage');
    const checkButton = document.getElementById('checkButton');
    const buttonText = document.getElementById('buttonText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('results-section');
    const testCaseDisplay = document.getElementById('testCaseDisplay');
    const differenceCount = document.getElementById('differenceCount');
    const hpuxResultImage = document.getElementById('hpuxResultImage');
    const linuxResultImage = document.getElementById('linuxResultImage');
    const hpuxResults = document.getElementById('hpuxResults');
    const linuxResults = document.getElementById('linuxResults');
    
    // Event listeners for drag and drop
    setupDropzone(hpuxDropzone, hpuxInput, hpuxPreview, hpuxPreviewImage);
    setupDropzone(linuxDropzone, linuxInput, linuxPreview, linuxPreviewImage);
    
    // Event listeners for remove buttons
    removeHpuxButton.addEventListener('click', () => {
        hpuxInput.value = '';
        hpuxPreview.classList.add('hidden');
        hpuxDropzone.classList.remove('hidden');
        updateSubmitButtonState();
    });
    
    removeLinuxButton.addEventListener('click', () => {
        linuxInput.value = '';
        linuxPreview.classList.add('hidden');
        linuxDropzone.classList.remove('hidden');
        updateSubmitButtonState();
    });
    
    // Event listener for file input change
    hpuxInput.addEventListener('change', () => handleFileInputChange(hpuxInput, hpuxPreview, hpuxPreviewImage, hpuxDropzone));
    linuxInput.addEventListener('change', () => handleFileInputChange(linuxInput, linuxPreview, linuxPreviewImage, linuxDropzone));
    
    // Event listener for form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const formData = new FormData(form);
            
            const response = await fetch('/api/compare', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                displayResults(result);
            } else {
                showError(result.message || 'Error processing comparison');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while processing the request.');
        } finally {
            setLoading(false);
        }
    });
    
    // Event listeners for viewing existing comparisons
    document.querySelectorAll('.view-comparison').forEach(button => {
        button.addEventListener('click', async () => {
            const comparisonId = button.getAttribute('data-id');
            await loadComparisonDetails(comparisonId);
        });
    });
    
    // Test case input change listener
    testCaseInput.addEventListener('input', updateSubmitButtonState);
    
    /**
     * Set up dropzone event listeners
     */
    function setupDropzone(dropzone, input, preview, previewImage) {
        // Prevent default behavior for drag events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            dropzone.addEventListener(event, preventDefaults, false);
        });
        
        // Highlight dropzone on drag over
        ['dragenter', 'dragover'].forEach(event => {
            dropzone.addEventListener(event, function() {
                dropzone.classList.add('dragover');
            }, false);
        });
        
        // Remove highlight on drag leave
        ['dragleave', 'drop'].forEach(event => {
            dropzone.addEventListener(event, function() {
                dropzone.classList.remove('dragover');
            }, false);
        });
        
        // Handle dropped files
        dropzone.addEventListener('drop', function(e) {
            const files = e.dataTransfer.files;
            if (files.length) {
                input.files = files;
                handleFileInputChange(input, preview, previewImage, dropzone);
            }
        }, false);
        
        // Handle click on dropzone
        dropzone.addEventListener('click', function() {
            input.click();
        });
    }
    
    /**
     * Handle file input change
     */
    function handleFileInputChange(input, preview, previewImage, dropzone) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validate file type
            if (!file.type.match('image.*')) {
                alert('Please select an image file');
                input.value = '';
                return;
            }
            
            // Display preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                preview.classList.remove('hidden');
                dropzone.classList.add('hidden');
                updateSubmitButtonState();
            };
            reader.readAsDataURL(file);
        }
    }
    
    /**
     * Update submit button state based on form inputs
     */
    function updateSubmitButtonState() {
        const hasTestCase = testCaseInput.value.trim() !== '';
        const hasHpuxImage = hpuxInput.files && hpuxInput.files.length > 0;
        const hasLinuxImage = linuxInput.files && linuxInput.files.length > 0;
        
        checkButton.disabled = !(hasTestCase && hasHpuxImage && hasLinuxImage);
    }
    
    /**
     * Validate form inputs
     */
    function validateForm() {
        const hasTestCase = testCaseInput.value.trim() !== '';
        const hasHpuxImage = hpuxInput.files && hpuxInput.files.length > 0;
        const hasLinuxImage = linuxInput.files && linuxInput.files.length > 0;
        
        if (!hasTestCase) {
            alert('Please enter a test case name');
            return false;
        }
        
        if (!hasHpuxImage) {
            alert('Please select an HPUX image');
            return false;
        }
        
        if (!hasLinuxImage) {
            alert('Please select a Linux image');
            return false;
        }
        
        return true;
    }
    
    /**
     * Set loading state
     */
    function setLoading(isLoading) {
        if (isLoading) {
            buttonText.classList.add('hidden');
            loadingSpinner.classList.remove('hidden');
            checkButton.disabled = true;
        } else {
            buttonText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            updateSubmitButtonState();
        }
    }
    
    /**
     * Display comparison results
     */
    function displayResults(result) {
        // Update test case display
        testCaseDisplay.textContent = result.comparison.testCase;
        
        // Update difference count badge
        const count = result.comparisonResult.differenceCount;
        if (count === 0) {
            differenceCount.textContent = 'No differences found';
            differenceCount.className = 'badge bg-green-100 text-green-800';
        } else {
            differenceCount.textContent = `${count} differences found`;
            differenceCount.className = 'badge bg-red-100 text-red-800';
        }
        
        // Update images
        hpuxResultImage.src = `/${result.comparison.hpuxImagePath}`;
        linuxResultImage.src = `/${result.comparison.linuxImagePath}`;
        
        // Render results
        renderExtractedData(hpuxResults, result.formattedResults.hpux);
        renderExtractedData(linuxResults, result.formattedResults.linux);
        
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Render extracted data with highlights
     */
    function renderExtractedData(container, data) {
        container.innerHTML = '';
        
        const table = document.createElement('table');
        table.className = 'min-w-full divide-y divide-gray-200';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const keyHeader = document.createElement('th');
        keyHeader.className = 'px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        keyHeader.textContent = 'Key';
        
        const valueHeader = document.createElement('th');
        valueHeader.className = 'px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
        valueHeader.textContent = 'Value';
        
        headerRow.appendChild(keyHeader);
        headerRow.appendChild(valueHeader);
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        tbody.className = 'bg-white divide-y divide-gray-200';
        
        // Add rows for each key-value pair
        Object.entries(data).forEach(([key, value], index) => {
            const row = document.createElement('tr');
            row.className = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
            
            const keyCell = document.createElement('td');
            keyCell.className = 'px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900';
            keyCell.textContent = key;
            
            const valueCell = document.createElement('td');
            valueCell.className = 'px-3 py-2 text-sm text-gray-500';
            valueCell.innerHTML = value; // Using innerHTML to render the HTML from the server
            
            row.appendChild(keyCell);
            row.appendChild(valueCell);
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
    }
    
    /**
     * Load comparison details by ID
     */
    async function loadComparisonDetails(id) {
        try {
            setLoading(true);
            
            const response = await fetch(`/api/comparison/${id}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                // Update form test case to match the loaded comparison
                testCaseInput.value = result.comparison.testCase;
                
                // Display results
                displayResults(result);
            } else {
                showError(result.message || 'Error loading comparison');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An error occurred while loading the comparison.');
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        alert(message);
    }
    
    /**
     * Prevent default behavior for events
     */
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
});