document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const movieInput = document.getElementById('movieInput');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');

    // Handle button click
    searchButton.addEventListener('click', getRecommendations);
    
    // Handle Enter key press
    movieInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            getRecommendations();
        }
    });

    async function getRecommendations() {
    const title = document.getElementById('movieInput').value.trim();
    const method = document.getElementById('methodSelect').value;
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    
    // Clear previous results
    resultsDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    // Validate input
    if (!title) {
        showError('Please enter a movie title');
        loadingDiv.style.display = 'none';
        return;
    }

    try {
        const response = await fetch('/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                title: title,
                method: method 
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get recommendations');
        }
        
        if (data.error) {
            showError(data.error, data.suggestions);
        } else {
            displayResults(data.movies);
        }
    } catch (error) {
        console.error('Recommendation error:', error);
        showError(error.message);
    } finally {
        loadingDiv.style.display = 'none';
    }
}

    function displayResults(movies) {
        if (!movies || movies.length === 0) {
            resultsDiv.innerHTML = '<p class="error">No recommendations found</p>';
            return;
        }
        
        movies.forEach(movie => {
            const movieElement = document.createElement('div');
            movieElement.className = 'movie-card';
            movieElement.innerHTML = `
                <h3>${movie.title} (${movie.year})</h3>
                <p class="movie-genres">${movie.genres}</p>
                <p class="movie-score">Recommendation score: ${movie.similarity_score.toFixed(2)}</p>
            `;
            resultsDiv.appendChild(movieElement);
        });
    }

    function showError(message, suggestions) {
        let errorHTML = `<div class="error">${message}</div>`;
        
        if (suggestions && suggestions.length > 0) {
            errorHTML += `<p>Did you mean: ${suggestions.join(', ')}?</p>`;
        }
        
        resultsDiv.innerHTML = errorHTML;
    }
});