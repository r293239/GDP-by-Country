// Sample country data for demonstration
const countries = [
    {
        id: "usa",
        name: "United States",
        historical_names: ["United States of America"],
        gdp_2023: 26840.0, // in billions
        gdp_per_capita_2023: 80165,
        population: 334.9, // in millions
        region: "North America",
        currency: "USD",
        world_share: 25.6,
        growth: 2.1
    },
    {
        id: "china",
        name: "China",
        historical_names: ["Chinese Empire", "Republic of China", "People's Republic of China"],
        gdp_2023: 17960.0,
        gdp_per_capita_2023: 12720,
        population: 1412.4,
        region: "East Asia",
        currency: "CNY",
        world_share: 17.1,
        growth: 5.2
    },
    {
        id: "japan",
        name: "Japan",
        historical_names: ["Empire of Japan", "State of Japan"],
        gdp_2023: 4210.0,
        gdp_per_capita_2023: 33638,
        population: 124.9,
        region: "East Asia",
        currency: "JPY",
        world_share: 4.0,
        growth: 1.9
    },
    {
        id: "germany",
        name: "Germany",
        historical_names: ["West Germany", "East Germany", "Federal Republic of Germany"],
        gdp_2023: 4080.0,
        gdp_per_capita_2023: 48398,
        population: 84.3,
        region: "Europe",
        currency: "EUR",
        world_share: 3.9,
        growth: -0.3
    },
    {
        id: "india",
        name: "India",
        historical_names: ["British India", "Dominion of India", "Republic of India"],
        gdp_2023: 3670.0,
        gdp_per_capita_2023: 2566,
        population: 1428.6,
        region: "South Asia",
        currency: "INR",
        world_share: 3.5,
        growth: 6.3
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadRanking('gdp');
    setupEventListeners();
    loadChart();
});

// Load ranking
function loadRanking(type) {
    const rankingList = document.getElementById('rankingList');
    const rankingType = document.getElementById('rankingType');
    
    // Sort countries based on type
    let sortedCountries = [...countries];
    if (type === 'gdp') {
        sortedCountries.sort((a, b) => b.gdp_2023 - a.gdp_2023);
        rankingType.textContent = 'Total GDP';
    } else {
        sortedCountries.sort((a, b) => b.gdp_per_capita_2023 - a.gdp_per_capita_2023);
        rankingType.textContent = 'GDP per Capita';
    }
    
    // Generate ranking HTML
    rankingList.innerHTML = '';
    sortedCountries.forEach((country, index) => {
        const rankClass = `rank-${index + 1}`;
        const gdpValue = type === 'gdp' 
            ? formatCurrency(country.gdp_2023) + 'B'
            : '$' + formatNumber(country.gdp_per_capita_2023);
        
        const item = document.createElement('div');
        item.className = 'ranking-item';
        item.innerHTML = `
            <div class="rank ${rankClass}">${index + 1}</div>
            <div class="country-name">${country.name}</div>
            <div class="country-gdp">${gdpValue}</div>
        `;
        item.addEventListener('click', () => showCountryDetails(country));
        rankingList.appendChild(item);
    });
    
    // Update global stats
    updateGlobalStats(sortedCountries);
}

// Show country details
function showCountryDetails(country) {
    const countryInfo = document.getElementById('selectedCountryInfo');
    const countryStats = document.getElementById('countryStats');
    
    countryInfo.innerHTML = `
        <h4>${country.name}</h4>
        <p>Region: ${country.region}</p>
        <a href="${country.id}.html" class="back-button" style="padding: 5px 10px; font-size: 0.9em;">
            View Full Profile
        </a>
    `;
    
    countryStats.innerHTML = `
        <div class="detail-item">
            <div class="stat-label">Total GDP</div>
            <div class="detail-value">${formatCurrency(country.gdp_2023)}B</div>
        </div>
        <div class="detail-item">
            <div class="stat-label">GDP/Capita</div>
            <div class="detail-value">$${formatNumber(country.gdp_per_capita_2023)}</div>
        </div>
        <div class="detail-item">
            <div class="stat-label">Population</div>
            <div class="detail-value">${formatNumber(country.population)}M</div>
        </div>
        <div class="detail-item">
            <div class="stat-label">World Share</div>
            <div class="detail-value">${country.world_share}%</div>
        </div>
        <div class="detail-item">
            <div class="stat-label">Growth</div>
            <div class="detail-value">${country.growth}%</div>
        </div>
    `;
    countryStats.style.display = 'grid';
}

// Update global statistics
function updateGlobalStats(sortedCountries) {
    const totalGDP = sortedCountries.reduce((sum, country) => sum + country.gdp_2023, 0);
    const avgGDPCapita = sortedCountries.reduce((sum, country) => sum + country.gdp_per_capita_2023, 0) / sortedCountries.length;
    
    document.getElementById('globalGdp').textContent = '$' + formatCurrency(totalGDP) + 'T';
    document.getElementById('avgGdpCapita').textContent = '$' + formatNumber(Math.round(avgGDPCapita));
    document.getElementById('topCountry').textContent = sortedCountries[0].name;
    document.getElementById('countryCount').textContent = sortedCountries.length;
}

// Load chart
function loadChart() {
    const ctx = document.getElementById('gdpChart').getContext('2d');
    const sortedCountries = [...countries].sort((a, b) => b.gdp_2023 - a.gdp_2023);
    const top10 = sortedCountries.slice(0, 10);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(c => c.name),
            datasets: [{
                label: 'GDP (Billions USD)',
                data: top10.map(c => c.gdp_2023),
                backgroundColor: '#4a6ee0',
                borderColor: '#3a5ed0',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'GDP (Billions USD)'
                    }
                }
            }
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // GDP total button
    document.getElementById('gdpTotalBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('gdpPerCapitaBtn').classList.remove('active');
        loadRanking('gdp');
        document.getElementById('chartTitle').textContent = 'Top 10 Countries by GDP (2023)';
    });
    
    // GDP per capita button
    document.getElementById('gdpPerCapitaBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('gdpTotalBtn').classList.remove('active');
        loadRanking('gdp_per_capita');
        document.getElementById('chartTitle').textContent = 'Top 10 Countries by GDP per Capita (2023)';
    });
    
    // Year selector
    document.getElementById('yearSelect').addEventListener('change', function() {
        // In a real app, this would load data for the selected year
        alert('Loading data for ' + this.value + '...');
    });
    
    // Search functionality
    const searchInput = document.getElementById('countrySearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        searchResults.innerHTML = '';
        
        if (query.length > 0) {
            const filtered = countries.filter(country => 
                country.name.toLowerCase().includes(query) ||
                country.historical_names.some(name => name.toLowerCase().includes(query))
            );
            
            if (filtered.length > 0) {
                searchResults.style.display = 'block';
                filtered.forEach(country => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `
                        <span>${country.name}</span>
                        <span>$${formatCurrency(country.gdp_2023)}B</span>
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
    
    // Close search results when clicking elsewhere
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });
}

// Helper functions
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCurrency(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'T';
    }
    return formatNumber(Math.round(num));
}
