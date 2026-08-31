// VETPAW Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Login Form Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const errorMessage = document.getElementById('error-message');
            
            // Clear previous messages
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
            
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Redirect to dashboard on success
                    window.location.href = data.redirect || '/dashboard';
                } else {
                    // Show error message
                    errorMessage.textContent = data.error || 'Login failed. Please try again.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Please try again.';
                errorMessage.style.display = 'block';
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
    
    // Register Form Handler
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                password: document.getElementById('password').value,
                confirm_password: document.getElementById('confirm_password').value,
                role: document.getElementById('role').value
            };
            
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            
            // Clear previous messages
            errorMessage.style.display = 'none';
            errorMessage.textContent = '';
            successMessage.style.display = 'none';
            successMessage.textContent = '';
            
            // Validate passwords match
            if (formData.password !== formData.confirm_password) {
                errorMessage.textContent = 'Passwords do not match.';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Validate password strength
            if (formData.password.length < 8) {
                errorMessage.textContent = 'Password must be at least 8 characters long.';
                errorMessage.style.display = 'block';
                return;
            }
            
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            
            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        full_name: formData.full_name,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password,
                        confirm_password: formData.confirm_password,
                        role: formData.role
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successMessage.textContent = data.message || 'Account created successfully! Redirecting to dashboard...';
                    successMessage.style.display = 'block';
                    
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        window.location.href = data.redirect || '/dashboard';
                    }, 2000);
                } else {
                    errorMessage.textContent = data.error || 'Registration failed. Please try again.';
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Please try again.';
                errorMessage.style.display = 'block';
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    }
    
    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            
            // You could add a visual strength indicator here
            // For now, we'll just log it
            console.log('Password strength:', strength);
        });
    });
    
    // Form field animations
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input, select');
        if (input) {
            input.addEventListener('focus', function() {
                group.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                group.classList.remove('focused');
                if (this.value) {
                    group.classList.add('filled');
                } else {
                    group.classList.remove('filled');
                }
            });
            
            // Check if input has value on load
            if (input.value) {
                group.classList.add('filled');
            }
        }
    });
});

function calculatePasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return strength;
}

// Utility function to show error messages
function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Utility function to show success messages
function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}
