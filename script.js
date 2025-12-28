// Global variables
let currentYear = "2025";
let currentView = "gdp"; // or "gdp_per_capita"
let allCountriesData = {};
let currentChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllCountriesData();
    updateDisplay();
    setupEventListeners();
});

// Load all country data files
async function loadAllCountriesData() {
    const countries = ['china', 'usa', 'india', 'germany', 'japan'];
    
    for (const country of countries) {
        try {
            const response = await fetch(`countries/${country}.html`);
            const html = await response.text();
            
            // Extract the data from the script tag
            const dataMatch = html.match(/const \w+GDPData = ({[\s\S]*?});/);
            if (dataMatch) {
                const dataString = dataMatch[1];
                // Fix the string to make it valid JSON
                const jsonString = dataString.replace(/(\w+):/g, '"$1":')
                    .replace(/'/g, '"');
                const countryData = JSON.parse(jsonString);
                allCountriesData[country] = countryData;
            }
        } catch (error) {
            console.error(`Error loading ${country} data:`, error);
        }
    }
}

// Update the display with current data
function updateDisplay() {
    updateRanking();
    updateGlobalStats();
    updateChart();
}

// Update ranking list
function updateRanking() {
    const rankingList = document.getElementById('rankingList');
    const rankingType = document.getElementById('rankingType');
    
    // Convert object to array and sort
    const countriesArray = Object.values(allCountriesData);
    
    if (currentView === "gdp") {
        countriesArray.sort((a, b) => 
            b.gdp_data[currentYear].gdp - a.gdp_data[currentYear].gdp
        );
        rankingType.textContent = "Total GDP (Billions USD)";
    } else {
        countriesArray.sort((a, b) => 
            b.gdp_data[currentYear].gdp_per_capita - a.gdp_data[currentYear].gdp_per_capita
        );
        rankingType.textContent = "GDP per Capita (USD)";
    }
    
    // Update year label
    document.querySelector('.year-label').textContent = currentYear;
    
    // Generate ranking HTML
    rankingList.innerHTML = '';
    countriesArray.forEach((country, index) => {
        const value = currentView === "gdp" 
            ? `$${formatNumber(country.gdp_data[currentYear].gdp)}B`
            : `$${formatNumber(country.gdp_data[currentYear].gdp_per_capita)}`;
        
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
    
    // Calculate global GDP (sum of all countries)
    const globalGDP = countriesArray.reduce((sum, country) => 
        sum + country.gdp_data[currentYear].gdp, 0
    );
    
    // Calculate average GDP per capita
    const avgGDPCapita = countriesArray.reduce((sum, country) => 
        sum + country.gdp_data[currentYear].gdp_per_capita, 0
    ) / countriesArray.length;
    
    // Get top country
    const topCountry = countriesArray.sort((a, b) => 
        b.gdp_data[currentYear].gdp - a.gdp_data[currentYear].gdp
    )[0];
    
    // Update DOM
    document.getElementById('globalGdp').textContent = `$${formatNumber(globalGDP / 1000)}T`;
    document.getElementById('avgGdpCapita').textContent = `$${formatNumber(Math.round(avgGDPCapita))}`;
    document.getElementById('topCountry').textContent = topCountry.name;
    document.getElementById('countryCount').textContent = countriesArray.length;
}

// Update the chart
function updateChart() {
    const ctx = document.getElementById('gdpChart').getContext('2d');
    
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }
    
    const countriesArray = Object.values(allCountriesData);
    const sortedCountries = [...countriesArray].sort((a, b) => 
        b.gdp_data[currentYear].gdp - a.gdp_data[currentYear].gdp
    );
    
    const chartType = currentView === "gdp" ? "bar" : "bar";
    const chartLabel = currentView === "gdp" ? "GDP (Billions USD)" : "GDP per Capita (USD)";
    const chartData = currentView === "gdp" 
        ? sortedCountries.map(c => c.gdp_data[currentYear].gdp)
        : sortedCountries.map(c => c.gdp_data[currentYear].gdp_per_capita);
    
    // Update chart title
    document.getElementById('chartTitle').textContent = 
        `Top 5 Countries by ${currentView === "gdp" ? "GDP" : "GDP per Capita"} (${currentYear})`;
    
    currentChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: sortedCountries.map(c => c.name),
            datasets: [{
                label: chartLabel,
                data: chartData,
                backgroundColor: [
                    '#667eea', '#f093fb', '#4facfe', '#43e97b', '#38f9d7'
                ],
                borderColor: [
                    '#5a6fd8', '#e082f1', '#3e9bf6', '#38d872', '#2ee9cf'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
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
    const currentData = country.gdp_data[currentYear];
    
    // Update basic info
    document.getElementById('selectedCountryInfo').innerHTML = `
        <h4>${country.name}</h4>
        <p><strong>Region:</strong> ${country.region}</p>
        <p><strong>Currency:</strong> ${country.currency}</p>
        <p><strong>Historical Names:</strong> ${country.historical_names.join(" → ")}</p>
    `;
    
    // Update stats grid
    document.getElementById('countryStats').innerHTML = `
        <div class="stat-item-small">
            <div class="stat-label-small">GDP (${currentYear})</div>
            <div class="stat-value-small">$${formatNumber(currentData.gdp)}B</div>
        </div>
        <div class="stat-item-small">
            <div class="stat-label-small">GDP/Capita</div>
            <div class="stat-value-small">$${formatNumber(currentData.gdp_per_capita)}</div>
        </div>
        <div class="stat-item-small">
            <div class="stat-label-small">Population</div>
            <div class="stat-value-small">${formatNumber(currentData.population)}M</div>
        </div>
        <div class="stat-item-small">
            <div class="stat-label-small">World Rank</div>
            <div class="stat-value-small">#${getCountryRank(country)}</div>
        </div>
        <div class="stat-item-small">
            <div class="stat-label-small">Growth (YoY)</div>
            <div class="stat-value-small">${calculateGrowthRate(country)}%</div>
        </div>
    `;
    
    // Update historical data table
    const historicalBody = document.getElementById('historicalDataBody');
    historicalBody.innerHTML = '';
    
    for (let year = 2025; year >= 2022; year--) {
        if (country.gdp_data[year]) {
            const yearData = country.gdp_data[year];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${year}</td>
                <td>$${formatNumber(yearData.gdp)} Billion</td>
                <td>$${formatNumber(yearData.gdp_per_capita)}</td>
            `;
            historicalBody.appendChild(row);
        }
    }
    
    // Show historical data section
    document.getElementById('historicalData').style.display = 'block';
    
    // Update view profile button
    const countryKey = Object.keys(allCountriesData).find(
        key => allCountriesData[key].name === country.name
    );
    document.getElementById('viewFullProfile').onclick = () => {
        window.open(`countries/${countryKey}.html`, '_blank');
    };
}

// Get country rank
function getCountryRank(country) {
    const countriesArray = Object.values(allCountriesData);
    countriesArray.sort((a, b) => 
        b.gdp_data[currentYear].gdp - a.gdp_data[currentYear].gdp
    );
    return countriesArray.findIndex(c => c.name === country.name) + 1;
}

// Calculate year-over-year growth rate
function calculateGrowthRate(country) {
    const currentYearInt = parseInt(currentYear);
    const prevYear = (currentYearInt - 1).toString();
    
    if (country.gdp_data[prevYear]) {
        const currentGDP = country.gdp_data[currentYear].gdp;
        const prevGDP = country.gdp_data[prevYear].gdp;
        const growth = ((currentGDP - prevGDP) / prevGDP) * 100;
        return growth.toFixed(1);
    }
    return "N/A";
}

// Setup event listeners
function setupEventListeners() {
    // Year selector
    document.getElementById('yearSelect').addEventListener('change', function() {
        currentYear = this.value;
        updateDisplay();
    });
    
    // View toggle buttons
    document.getElementById('gdpTotalBtn').addEventListener('click', function() {
        currentView = "gdp";
        this.classList.add('active');
        document.getElementById('gdpPerCapitaBtn').classList.remove('active');
        updateDisplay();
    });
    
    document.getElementById('gdpPerCapitaBtn').addEventListener('click', function() {
        currentView = "gdp_per_capita";
        this.classList.add('active');
        document.getElementById('gdpTotalBtn').classList.remove('active');
        updateDisplay();
    });
    
    // Search functionality
    const searchInput = document.getElementById('countrySearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        searchResults.innerHTML = '';
        
        if (query.length > 0) {
            const countriesArray = Object.values(allCountriesData);
            const filtered = countriesArray.filter(country => 
                country.name.toLowerCase().includes(query) ||
                country.historical_names.some(name => 
                    name.toLowerCase().includes(query)
                )
            );
            
            if (filtered.length > 0) {
                searchResults.style.display = 'block';
                filtered.forEach(country => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `
                        <span>${country.name}</span>
                        <span class="gdp-value">$${formatNumber(country.gdp_data[currentYear].gdp)}B</span>
                    `;
                    item.addEventListener('click', () => {
                        showCountryDetails(country);
                        searchResults.style.display = 'none';
                        searchInput.value = '';
                    });
                    searchResults.appendChild(item);
                });
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

// Helper function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
