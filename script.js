// Global variables
let currentYear = "2025";
let currentView = "gdp";
let allCountriesData = {};
let currentChart = null;

// List of countries to load
const countryFiles = ["china", "usa", "india", "germany", "japan"];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log("GDP by Country - Loading data from files...");
    loadAllCountriesData();
    setupEventListeners();
});

// Load all country data files
async function loadAllCountriesData() {
    console.log("Starting to load country data files...");
    
    // Clear existing data
    allCountriesData = {};
    
    // Create a list of promises for loading each file
    const loadPromises = countryFiles.map(countryCode => 
        loadCountryData(countryCode)
    );
    
    // Wait for all files to load
    await Promise.all(loadPromises);
    
    console.log("Finished loading all country data");
    console.log("Loaded countries:", Object.keys(allCountriesData));
    
    // Update the display with loaded data
    updateDisplay();
}

// Load individual country data
async function loadCountryData(countryCode) {
    try {
        // IMPORTANT: We need to load the file as a JavaScript module, not HTML
        const filePath = `countries/${countryCode}.html`;
        console.log(`Loading: ${filePath}`);
        
        // Fetch the file
        const response = await fetch(filePath);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const fileContent = await response.text();
        
        // Extract just the JavaScript from the file
        // Look for the script tag content
        const scriptStart = fileContent.indexOf('<script>');
        const scriptEnd = fileContent.indexOf('</script>');
        
        if (scriptStart === -1 || scriptEnd === -1) {
            throw new Error(`No script tag found in ${countryCode}.html`);
        }
        
        // Extract the JavaScript code between script tags
        const jsCode = fileContent.substring(scriptStart + 8, scriptEnd).trim();
        
        // Create a temporary function to execute the JavaScript and get the gdpData variable
        const tempFunction = new Function(`
            ${jsCode}
            return window.gdpData || gdpData;
        `);
        
        // Execute the code and get the data
        const countryData = tempFunction();
        
        if (!countryData || !countryData.name) {
            throw new Error(`Invalid data format in ${countryCode}.html`);
        }
        
        // Store the data
        allCountriesData[countryCode] = countryData;
        
        console.log(`✓ Loaded: ${countryData.name}`);
        
    } catch (error) {
        console.error(`✗ Failed to load ${countryCode}:`, error);
        
        // Create fallback data if file doesn't load
        allCountriesData[countryCode] = createFallbackData(countryCode);
    }
}

// Create fallback data if file fails to load
function createFallbackData(countryCode) {
    const nameMap = {
        "china": "China",
        "usa": "United States", 
        "india": "India",
        "germany": "Germany",
        "japan": "Japan"
    };
    
    return {
        name: nameMap[countryCode] || countryCode,
        region: "Unknown",
        gdp: { 2025: 1000, 2024: 950, 2023: 900, 2022: 850 },
        gdp_per_capita: { 2025: 10000, 2024: 9500, 2023: 9000, 2022: 8500 }
    };
}

// Update the display with current data
function updateDisplay() {
    if (Object.keys(allCountriesData).length === 0) {
        console.log("No country data available yet");
        showLoadingMessage();
        return;
    }
    
    console.log("Updating display with", Object.keys(allCountriesData).length, "countries");
    
    updateRanking();
    updateGlobalStats();
    updateChart();
}

// Show loading message while data loads
function showLoadingMessage() {
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '<div class="loading">Loading country data...</div>';
    
    const countryInfo = document.getElementById('selectedCountryInfo');
    countryInfo.innerHTML = '<p class="select-hint">Loading country data, please wait...</p>';
}

// Update ranking list
function updateRanking() {
    const rankingList = document.getElementById('rankingList');
    const rankingType = document.getElementById('rankingType');
    
    if (!rankingList) {
        console.error("Ranking list element not found!");
        return;
    }
    
    // Convert object to array
    const countriesArray = Object.values(allCountriesData);
    
    if (countriesArray.length === 0) {
        rankingList.innerHTML = '<div class="error">No data loaded</div>';
        return;
    }
    
    // Sort based on current view
    if (currentView === "gdp") {
        countriesArray.sort((a, b) => 
            b.gdp[currentYear] - a.gdp[currentYear]
        );
        rankingType.textContent = "Total GDP (Billions USD)";
    } else {
        countriesArray.sort((a, b) => 
            b.gdp_per_capita[currentYear] - a.gdp_per_capita[currentYear]
        );
        rankingType.textContent = "GDP per Capita (USD)";
    }
    
    // Update year label
    const yearLabel = document.querySelector('.year-label');
    if (yearLabel) {
        yearLabel.textContent = currentYear;
    }
    
    // Generate ranking HTML
    rankingList.innerHTML = '';
    countriesArray.forEach((country, index) => {
        const value = currentView === "gdp" 
            ? `$${formatNumber(country.gdp[currentYear])}B`
            : `$${formatNumber(country.gdp_per_capita[currentYear])}`;
        
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="rank rank-${index + 1}">${index + 1}</div>
            <div class="country-name">${country.name}</div>
            <div class="country-gdp">${value}</div>
        `;
        item.addEventListener('click', () => showCountryDetails(country));
        rankingList.appendChild(item);
    });
}

// Update global statistics
function updateGlobalStats() {
    const countriesArray = Object.values(allCountriesData);
    
    if (countriesArray.length === 0) {
        document.getElementById('globalGdp').textContent = "$0T";
        document.getElementById('avgGdpCapita').textContent = "$0";
        document.getElementById('topCountry').textContent = "None";
        document.getElementById('countryCount').textContent = "0";
        return;
    }
    
    // Calculate global GDP (sum of all countries)
    const globalGDP = countriesArray.reduce((sum, country) => 
        sum + (country.gdp[currentYear] || 0), 0
    );
    
    // Calculate average GDP per capita
    const avgGDPCapita = countriesArray.reduce((sum, country) => 
        sum + (country.gdp_per_capita[currentYear] || 0), 0
    ) / countriesArray.length;
    
    // Get top country
    const topCountry = [...countriesArray].sort((a, b) => 
        (b.gdp[currentYear] || 0) - (a.gdp[currentYear] || 0)
    )[0];
    
    // Update DOM
    const globalGdpElement = document.getElementById('globalGdp');
    const avgGdpCapitaElement = document.getElementById('avgGdpCapita');
    const topCountryElement = document.getElementById('topCountry');
    const countryCountElement = document.getElementById('countryCount');
    
    if (globalGdpElement) globalGdpElement.textContent = `$${formatNumber(globalGDP / 1000)}T`;
    if (avgGdpCapitaElement) avgGdpCapitaElement.textContent = `$${formatNumber(Math.round(avgGDPCapita))}`;
    if (topCountryElement) topCountryElement.textContent = topCountry.name || "Unknown";
    if (countryCountElement) countryCountElement.textContent = countriesArray.length;
}

// Update the chart
function updateChart() {
    const ctx = document.getElementById('gdpChart');
    if (!ctx) {
        console.error("Chart canvas not found!");
        return;
    }
    
    const chartContext = ctx.getContext('2d');
    
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }
    
    const countriesArray = Object.values(allCountriesData);
    if (countriesArray.length === 0) {
        // Show empty chart message
        currentChart = new Chart(chartContext, {
            type: 'bar',
            data: { labels: ['No Data'], datasets: [{ data: [0], backgroundColor: '#ccc' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }
    
    const sortedCountries = [...countriesArray].sort((a, b) => 
        (b.gdp[currentYear] || 0) - (a.gdp[currentYear] || 0)
    );
    
    const chartLabel = currentView === "gdp" ? "GDP (Billions USD)" : "GDP per Capita (USD)";
    const chartData = currentView === "gdp" 
        ? sortedCountries.map(c => c.gdp[currentYear] || 0)
        : sortedCountries.map(c => c.gdp_per_capita[currentYear] || 0);
    
    // Update chart title
    const chartTitle = document.getElementById('chartTitle');
    if (chartTitle) {
        chartTitle.textContent = 
            `Top ${Math.min(sortedCountries.length, 10)} Countries by ${currentView === "gdp" ? "GDP" : "GDP per Capita"} (${currentYear})`;
    }
    
    // Generate colors
    const colors = [
        '#667eea', '#f093fb', '#4facfe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#d299c2', '#f6d365'
    ];
    
    currentChart = new Chart(chartContext, {
        type: 'bar',
        data: {
            labels: sortedCountries.map(c => c.name),
            datasets: [{
                label: chartLabel,
                data: chartData,
                backgroundColor: colors.slice(0, sortedCountries.length),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return currentView === "gdp" 
                                ? `$${formatNumber(value)}B`
                                : `$${formatNumber(value)}`;
                        }
                    }
                }
            }
        }
    });
}

// Show country details when clicked
function showCountryDetails(country) {
    const currentGdp = country.gdp[currentYear] || 0;
    const currentGdpPerCapita = country.gdp_per_capita[currentYear] || 0;
    
    // Update basic info
    const countryInfo = document.getElementById('selectedCountryInfo');
    if (countryInfo) {
        countryInfo.innerHTML = `
            <h4>${country.name}</h4>
            <p><strong>Region:</strong> ${country.region || "Unknown"}</p>
            <p><strong>GDP (${currentYear}):</strong> $${formatNumber(currentGdp)} Billion</p>
            <p><strong>GDP per Capita:</strong> $${formatNumber(currentGdpPerCapita)}</p>
        `;
    }
    
    // Update stats grid
    const countryStats = document.getElementById('countryStats');
    if (countryStats) {
        countryStats.innerHTML = `
            <div class="stat-item-small">
                <div class="stat-label-small">GDP (${currentYear})</div>
                <div class="stat-value-small">$${formatNumber(currentGdp)}B</div>
            </div>
            <div class="stat-item-small">
                <div class="stat-label-small">GDP/Capita</div>
                <div class="stat-value-small">$${formatNumber(currentGdpPerCapita)}</div>
            </div>
            <div class="stat-item-small">
                <div class="stat-label-small">World Rank</div>
                <div class="stat-value-small">#${getCountryRank(country)}</div>
            </div>
            <div class="stat-item-small">
                <div class="stat-label-small">Year-over-Year</div>
                <div class="stat-value-small">${calculateGrowthRate(country)}%</div>
            </div>
        `;
        countryStats.style.display = 'grid';
    }
    
    // Update historical data table
    const historicalData = document.getElementById('historicalData');
    const historicalBody = document.getElementById('historicalDataBody');
    
    if (historicalData && historicalBody) {
        historicalBody.innerHTML = '';
        
        for (let year = 2025; year >= 2022; year--) {
            if (country.gdp[year] !== undefined) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${year}</td>
                    <td>$${formatNumber(country.gdp[year])}B</td>
                    <td>$${formatNumber(country.gdp_per_capita[year])}</td>
                `;
                historicalBody.appendChild(row);
            }
        }
        
        historicalData.style.display = 'block';
    }
}

// Get country rank
function getCountryRank(country) {
    const countriesArray = Object.values(allCountriesData);
    countriesArray.sort((a, b) => 
        (b.gdp[currentYear] || 0) - (a.gdp[currentYear] || 0)
    );
    const rank = countriesArray.findIndex(c => c.name === country.name) + 1;
    return rank > 0 ? rank : "N/A";
}

// Calculate year-over-year growth rate
function calculateGrowthRate(country) {
    const currentYearInt = parseInt(currentYear);
    const prevYear = (currentYearInt - 1).toString();
    
    if (country.gdp[prevYear] && country.gdp[prevYear] > 0) {
        const currentGDP = country.gdp[currentYear] || 0;
        const prevGDP = country.gdp[prevYear];
        const growth = ((currentGDP - prevGDP) / prevGDP) * 100;
        return growth.toFixed(1);
    }
    return "N/A";
}

// Setup event listeners
function setupEventListeners() {
    // Year selector
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.addEventListener('change', function() {
            currentYear = this.value;
            console.log("Year changed to:", currentYear);
            updateDisplay();
        });
    }
    
    // View toggle buttons
    const gdpTotalBtn = document.getElementById('gdpTotalBtn');
    const gdpPerCapitaBtn = document.getElementById('gdpPerCapitaBtn');
    
    if (gdpTotalBtn) {
        gdpTotalBtn.addEventListener('click', function() {
            currentView = "gdp";
            this.classList.add('active');
            if (gdpPerCapitaBtn) gdpPerCapitaBtn.classList.remove('active');
            console.log("View changed to: Total GDP");
            updateDisplay();
        });
    }
    
    if (gdpPerCapitaBtn) {
        gdpPerCapitaBtn.addEventListener('click', function() {
            currentView = "gdp_per_capita";
            this.classList.add('active');
            if (gdpTotalBtn) gdpTotalBtn.classList.remove('active');
            console.log("View changed to: GDP per Capita");
            updateDisplay();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('countrySearch');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            searchResults.innerHTML = '';
            
            if (query.length > 0 && Object.keys(allCountriesData).length > 0) {
                const countriesArray = Object.values(allCountriesData);
                const filtered = countriesArray.filter(country => 
                    country.name.toLowerCase().includes(query)
                );
                
                if (filtered.length > 0) {
                    searchResults.style.display = 'block';
                    filtered.forEach(country => {
                        const item = document.createElement('div');
                        item.className = 'search-result-item';
                        item.innerHTML = `
                            <span>${country.name}</span>
                            <span class="gdp-value">$${formatNumber(country.gdp[currentYear] || 0)}B</span>
                        `;
                        item.addEventListener('click', () => {
                            showCountryDetails(country);
                            searchResults.style.display = 'none';
                            searchInput.value = '';
                        });
                        searchResults.appendChild(item);
                    });
                } else {
                    searchResults.style.display = 'block';
                    searchResults.innerHTML = '<div class="no-results">No countries found</div>';
                }
            } else {
                searchResults.style.display = 'none';
            }
        });
        
        // Close search results when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
}

// Helper function to format numbers with commas
function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 0
    });
}
