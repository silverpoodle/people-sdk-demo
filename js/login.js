// js/login.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const mobileInput = document.getElementById('mobile');
            const mobile = mobileInput.value.trim();
            
            if (!mobile) {
                alert('찾지 못했습니다.');
                mobileInput.focus();
                return;
            }

            const loginBtn = loginForm.querySelector('.login-btn');

            try {
                loginBtn.disabled = true;
                loginBtn.textContent = '로그인 중...';

                const apiUrl = 'https://ejgdwr.api.infobip.com/people/2/persons?type=PHONE&identifier=' + mobile; 

                const response = await fetch(apiUrl, {
                    method: 'GET',
                   headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': 'App 8370536f468242d2bef67e8f832dd9d3-6cab6484-13e1-4d3e-8114-3b83bef5bf19'
                   }
                });

               if (response.ok) {
                    const userData = await response.json();

                    if (userData.firstName && userData.lastName) {
                        alert('로그인 성공했습니다');

                        if (window.pe) {
                            // 연락처(phone, email) 배열에서 primary 혹은 첫번째 항목을 선택해서 setPerson에 포함
                            const phoneNumbers = userData.contactInformation?.phone || [];
                            const emails = userData.contactInformation?.email || [];
                            const country = userData.country;

                            await pe.setPerson({
                                phone: mobile,
                            });

                            console.log(`Infobip: Session started for ${mobile}`);
                        }

                        localStorage.setItem('userFirstName', userData.firstName);
                        localStorage.setItem('userLastName', userData.lastName);

                        const peStateRaw = localStorage.getItem('PE:state');
                        if (peStateRaw) {
                            try {
                                const peState = JSON.parse(peStateRaw);
                                peState.userData = userData; // userData 통째로 추가
                                localStorage.setItem('PE:state', JSON.stringify(peState));
                            } catch (err) {
                                console.error('Failed to update PE:state:', err);
                            }
                        }

                        
                        window.location.href = 'index.html';
                    } else {
                        throw new Error('Person not found');
                    }
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Person not found');
                }

            } catch (error) {
                console.error('Login failed:', error);
                alert(error.message);
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        });
    }
});