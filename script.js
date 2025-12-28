// Global variables
let currentYear = "2025";
let currentView = "gdp";
let allCountriesData = {};
let currentChart = null;

// List of countries to load
const countryFiles = [
    "china", "usa", "india", "germany", "japan",
    "uk", "france", "italy", "brazil", "canada"
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadAllCountriesData();
    setupEventListeners();
});

// Load all country data files
async function loadAllCountriesData() {
    console.log("Loading country data...");
    
    for (const country of countryFiles) {
        try {
            // Load the country HTML file
            const response = await fetch(`countries/${country}.html`);
            const html = await response.text();
            
            // Parse the HTML to find GDP data
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const scriptTags = doc.getElementsByTagName('script');
            
            let countryGDPData = null;
            
            // Look for the GDP data in script tags
            for (let script of scriptTags) {
                if (script.textContent.includes('const gdpData =')) {
                    // Extract the data using regex
                    const match = script.textContent.match(/const gdpData = ({[\s\S]*?});/);
                    if (match) {
                        try {
                            // Clean the string and parse as JSON
                            let dataString = match[1]
                                .replace(/(\w+):/g, '"$1":') // Add quotes to keys
                                .replace(/'/g, '"')         // Replace single quotes
                                .replace(/,\s*}/g, '}');    // Remove trailing commas
                            
                            countryGDPData = JSON.parse(dataString);
                            console.log(`Loaded data for ${countryGDPData.name}`);
                        } catch (e) {
                            console.error(`Error parsing ${country} data:`, e);
                            // Fallback: create basic data
                            countryGDPData = createDefaultData(country);
                        }
                    }
                }
            }
            
            // If no data found in script, create default
            if (!countryGDPData) {
                console.warn(`No data found for ${country}, using default`);
                countryGDPData = createDefaultData(country);
            }
            
            // Store the data with country code as key
            allCountriesData[country] = countryGDPData;
            
        } catch (error) {
            console.error(`Error loading ${country}:`, error);
            // Create default data for this country
            allCountriesData[country] = createDefaultData(country);
        }
    }
    
    // After loading all data, update the display
    updateDisplay();
}

// Create default data if file doesn't exist
function createDefaultData(countryCode) {
    const countryNames = {
        "china": "China",
        "usa": "United States",
        "india": "India",
        "germany": "Germany",
        "japan": "Japan",
        "uk": "United Kingdom",
        "france": "France",
        "italy": "Italy",
        "brazil": "Brazil",
        "canada": "Canada"
    };
    
    const name = countryNames[countryCode] || countryCode;
    
    return {
        name: name,
        historical_names: [name],
        region: "Unknown",
        currency: "USD",
        gdp_data: {
            "2025": { gdp: 1000, gdp_per_capita: 10000, population: 100 },
            "2024": { gdp: 950, gdp_per_capita: 9500, population: 100 },
            "2023": { gdp: 900, gdp_per_capita: 9000, population: 100 },
            "2022": { gdp: 850, gdp_per_capita: 8500, population: 100 }
        }
    };
}

// Update the display with current data
function updateDisplay() {
    if (Object.keys(allCountriesData).length === 0) {
        console.log("No country data loaded yet");
        return;
    }
    
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
    ).slice(0, 10); // Show top 10
    
    const chartType = "bar";
    const chartLabel = currentView === "gdp" ? "GDP (Billions USD)" : "GDP per Capita (USD)";
    const chartData = currentView === "gdp" 
        ? sortedCountries.map(c => c.gdp_data[currentYear].gdp)
        : sortedCountries.map(c => c.gdp_data[currentYear].gdp_per_capita);
    
    // Update chart title
    document.getElementById('chartTitle').textContent = 
        `Top ${sortedCountries.length} Countries by ${currentView === "gdp" ? "GDP" : "GDP per Capita"} (${currentYear})`;
    
    // Generate colors for chart
    const colors = [
        '#667eea', '#f093fb', '#4facfe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#d299c2', '#f6d365'
    ];
    
    currentChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: sortedCountries.map(c => c.name),
            datasets: [{
                label: chartLabel,
                data: chartData,
                backgroundColor: colors.slice(0, sortedCountries.length),
                borderColor: colors.slice(0, sortedCountries.length).map(c => darkenColor(c, 20)),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            return currentView === "gdp" 
                                ? `GDP: $${formatNumber(value)} Billion`
                                : `GDP per capita: $${formatNumber(value)}`;
                        }
                    }
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
        if (countryKey && countryFiles.includes(countryKey)) {
            window.open(`countries/${countryKey}.html`, '_blank');
        }
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
        
        if (query.length > 0 && Object.keys(allCountriesData).length > 0) {
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
    
    // View full profile button
    document.getElementById('viewFullProfile').addEventListener('click', function() {
        const selectedCountry = document.querySelector('.ranking-item:hover');
        if (selectedCountry) {
            const countryName = selectedCountry.querySelector('.country-name').textContent;
            const country = Object.values(allCountriesData).find(c => c.name === countryName);
            if (country) {
                const countryKey = Object.keys(allCountriesData).find(
                    key => allCountriesData[key].name === country.name
                );
                if (countryKey) {
                    window.open(`countries/${countryKey}.html`, '_blank');
                }
            }
        }
    });
}

// Helper function to format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to darken colors
function darkenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
