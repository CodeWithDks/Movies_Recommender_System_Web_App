document.addEventListener('DOMContentLoaded', function() {
    const searchButton = document.getElementById('searchButton');
    const movieInput = document.getElementById('movieInput');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');

    // Add loading class management
    const body = document.body;
    
    // Add Deepak Singh signature effect
    console.log('%c🎬 Movie Recommendation System 🎬', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c✨ Developed by Deepak Singh ✨', 'color: #f7971e; font-size: 16px; font-weight: bold;');
    console.log('%c🚀 Built with passion and modern web technologies!', 'color: #4facfe; font-size: 14px;');
    
    // Enhanced button interactions
    searchButton.addEventListener('click', getRecommendations);
    
    // Enhanced Enter key handling with animation
    movieInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            // Add visual feedback
            searchButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                searchButton.style.transform = '';
            }, 150);
            getRecommendations();
        }
    });

    // Add input focus animations
    movieInput.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });

    movieInput.addEventListener('blur', function() {
        this.parentElement.style.transform = '';
    });

    // Add typing animation feedback
    movieInput.addEventListener('input', function() {
        const button = searchButton;
        if (this.value.trim()) {
            button.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        } else {
            button.style.background = '';
        }
    });

    // Add developer signature animation
    function addDeveloperSignature() {
        const signature = document.createElement('div');
        signature.innerHTML = '💻 DS';
        signature.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            color: white;
            cursor: pointer;
            z-index: 1000;
            opacity: 0.8;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(247, 151, 30, 0.3);
        `;
        
        signature.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
            this.style.opacity = '1';
            this.innerHTML = '👨‍💻';
        });
        
        signature.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.opacity = '0.8';
            this.innerHTML = '💻 DS';
        });
        
        signature.addEventListener('click', function() {
            showDeveloperInfo();
        });
        
        document.body.appendChild(signature);
    }

    function showDeveloperInfo() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 2rem;
                text-align: center;
                max-width: 400px;
                margin: 1rem;
                animation: fadeInScale 0.3s ease-out;
            ">
                <h3 style="color: #f7971e; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span style="font-size: 1.5em;">👨‍💻</span>
                    Deepak Singh
                </h3>
                <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1.5rem; line-height: 1.6;">
                    Full Stack Developer passionate about creating modern, user-friendly web applications with cutting-edge technologies.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 1.5rem;">
                    <span style="background: rgba(255, 255, 255, 0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">HTML</span>
                    <span style="background: rgba(255, 255, 255, 0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">CSS</span>
                    <span style="background: rgba(255, 255, 255, 0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">JavaScript</span>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 25px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    ✨ Awesome!
                </button>
            </div>
        `;
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
    }

    // Initialize developer signature
    setTimeout(addDeveloperSignature, 2000);

    async function getRecommendations() {
        const title = movieInput.value.trim();
        const method = document.getElementById('methodSelect').value;
        
        // Clear previous results with animation
        if (resultsDiv.children.length > 0) {
            resultsDiv.style.opacity = '0';
            resultsDiv.style.transform = 'translateY(20px)';
            setTimeout(() => {
                resultsDiv.innerHTML = '';
                resultsDiv.style.opacity = '1';
                resultsDiv.style.transform = '';
            }, 300);
        }
        
        // Enhanced loading animation
        showLoading();
        
        // Validate input
        if (!title) {
            showError('Please enter a movie title');
            hideLoading();
            return;
        }

        // Add button loading state
        const originalButtonContent = searchButton.innerHTML;
        searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        searchButton.disabled = true;

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
                // Add success message with developer credit
                setTimeout(() => {
                    const successMsg = document.createElement('div');
                    successMsg.innerHTML = '✨ Recommendations powered by Deepak Singh\'s algorithm';
                    successMsg.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
                        color: white;
                        padding: 0.75rem 1rem;
                        border-radius: 25px;
                        font-size: 0.9rem;
                        font-weight: 500;
                        z-index: 1000;
                        animation: slideInRight 0.5s ease-out;
                        box-shadow: 0 4px 15px rgba(86, 171, 47, 0.3);
                    `;
                    
                    document.body.appendChild(successMsg);
                    
                    setTimeout(() => {
                        successMsg.style.animation = 'slideOutRight 0.5s ease-in';
                        setTimeout(() => {
                            successMsg.remove();
                        }, 500);
                    }, 3000);
                }, 1000);
            }
        } catch (error) {
            console.error('Recommendation error:', error);
            showError('Something went wrong. Please try again.');
        } finally {
            hideLoading();
            // Restore button state
            searchButton.innerHTML = originalButtonContent;
            searchButton.disabled = false;
        }
    }

    function showLoading() {
        loadingDiv.style.display = 'block';
        loadingDiv.style.opacity = '0';
        loadingDiv.style.transform = 'translateY(20px)';
        
        // Animate in
        setTimeout(() => {
            loadingDiv.style.transition = 'all 0.3s ease';
            loadingDiv.style.opacity = '1';
            loadingDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    function hideLoading() {
        loadingDiv.style.opacity = '0';
        loadingDiv.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 300);
    }

    function displayResults(movies) {
        if (!movies || movies.length === 0) {
            showError('No recommendations found. Try a different movie!');
            return;
        }
        
        // Clear results
        resultsDiv.innerHTML = '';
        
        // Add results with staggered animation
        movies.forEach((movie, index) => {
            setTimeout(() => {
                const movieElement = document.createElement('div');
                movieElement.className = 'movie-card';
                
                // Enhanced movie card with better formatting
                const year = movie.year || 'N/A';
                const genres = movie.genres || 'Not specified';
                const score = movie.similarity_score || 0;
                
                movieElement.innerHTML = `
                    <h3>${escapeHtml(movie.title)} (${year})</h3>
                    <p class="movie-genres">${escapeHtml(genres)}</p>
                    <div class="movie-score">Score: ${score.toFixed(2)}</div>
                `;
                
                // Add hover sound effect (visual feedback)
                movieElement.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-8px) scale(1.02)';
                });
                
                movieElement.addEventListener('mouseleave', function() {
                    this.style.transform = '';
                });
                
                // Initial state for animation
                movieElement.style.opacity = '0';
                movieElement.style.transform = 'translateY(30px)';
                
                resultsDiv.appendChild(movieElement);
                
                // Animate in
                setTimeout(() => {
                    movieElement.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    movieElement.style.opacity = '1';
                    movieElement.style.transform = 'translateY(0)';
                }, 50);
                
            }, index * 100); // Stagger animation
        });
    }

    function showError(message, suggestions) {
        resultsDiv.innerHTML = '';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'error';
        
        let errorHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Oops!</strong>
            </div>
            <p>${escapeHtml(message)}</p>
        `;
        
        if (suggestions && suggestions.length > 0) {
            errorHTML += `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 107, 107, 0.2);">
                    <p><strong>Did you mean:</strong></p>
                    <div style="margin-top: 0.5rem;">
                        ${suggestions.map(suggestion => 
                            `<span style="display: inline-block; background: rgba(255,255,255,0.1); padding: 0.25rem 0.5rem; margin: 0.25rem; border-radius: 12px; cursor: pointer;" onclick="document.getElementById('movieInput').value='${escapeHtml(suggestion)}'">${escapeHtml(suggestion)}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        errorElement.innerHTML = errorHTML;
        
        // Animation
        errorElement.style.opacity = '0';
        errorElement.style.transform = 'translateY(20px)';
        
        resultsDiv.appendChild(errorElement);
        
        setTimeout(() => {
            errorElement.style.transition = 'all 0.3s ease';
            errorElement.style.opacity = '1';
            errorElement.style.transform = 'translateY(0)';
        }, 10);
    }

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add some interactive effects
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.movie-card');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        });
    });

    // Reset card transforms when mouse leaves
    document.addEventListener('mouseleave', () => {
        const cards = document.querySelectorAll('.movie-card');
        cards.forEach(card => {
            card.style.transform = '';
        });
    });

    // Add CSS animations for slide effects
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeInScale {
            from {
                transform: scale(0.8);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});