// بيانات الطلب (يمكن استلامها من قاعدة البيانات أو localStorage)
let orderData = {
    items: [
        {
            id: 1,
            name: 'جبن لافاش كيري',
            quantity: 1,
            price: 350,
            image: 'https://via.placeholder.com/60x60/e5e5e5/999999?text=جبن'
        },
        {
            id: 2,
            name: 'زبدة طبيعية',
            quantity: 2,
            price: 35,
            image: 'https://via.placeholder.com/60x60/e5e5e5/999999?text=زبدة'
        },
        {
            id: 3,
            name: 'لبن طازج',
            quantity: 1,
            price: 25,
            image: 'https://via.placeholder.com/60x60/e5e5e5/999999?text=لبن'
        }
    ],
    deliveryFee: 20,
    subtotal: 0,
    total: 0
};

// حساب المجاميع
function calculateTotals() {
    orderData.subtotal = orderData.items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    orderData.total = orderData.subtotal + orderData.deliveryFee;
    
    updatePriceSummary();
}

// تحديث عرض ملخص الأسعار
function updatePriceSummary() {
    const priceRows = document.querySelectorAll('.price-row');
    if (priceRows.length >= 3) {
        priceRows[0].querySelector('span:last-child').textContent = `EGP ${orderData.subtotal}`;
        priceRows[1].querySelector('span:last-child').textContent = `EGP ${orderData.deliveryFee}`;
        priceRows[2].querySelector('span:last-child').textContent = `EGP ${orderData.total}`;
    }
}

// التحقق من صحة النموذج
function validateForm() {
    const form = document.getElementById('billing-form');
    const requiredFields = form.querySelectorAll('input[required]');
    let isValid = true;
    let firstInvalidField = null;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            isValid = false;
            if (!firstInvalidField) {
                firstInvalidField = field;
            }
        } else {
            field.style.borderColor = '#10B981';
        }
    });

    // التحقق من صحة البريد الإلكتروني
    const emailField = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailField.value && !emailRegex.test(emailField.value)) {
        emailField.style.borderColor = '#dc3545';
        isValid = false;
        if (!firstInvalidField) {
            firstInvalidField = emailField;
        }
    }

    // التحقق من رقم الهاتف
    const phoneField = document.getElementById('phone');
    const phoneRegex = /^[0-9+\-\s()]{10,}$/;
    if (phoneField.value && !phoneRegex.test(phoneField.value)) {
        phoneField.style.borderColor = '#dc3545';
        isValid = false;
        if (!firstInvalidField) {
            firstInvalidField = phoneField;
        }
    }

    if (!isValid && firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
}

// إتمام الطلب
function placeOrder() {
    if (!validateForm()) {
        showNotification('يرجى ملء جميع الحقول المطلوبة بشكل صحيح', 'error');
        return;
    }

    const selectedPayment = document.querySelector('input[name="payment"]:checked');
    if (!selectedPayment) {
        showNotification('يرجى اختيار طريقة الدفع', 'error');
        return;
    }

    // إذا كان الدفع عند التسليم، إتمام الطلب مباشرة
    if (selectedPayment.value === 'cash') {
        processOrder(selectedPayment.value);
        return;
    }

    // إذا كان تحويل بنكي أو محفظة إلكترونية، فتح الفورم المناسبة
    if (selectedPayment.value === 'bank') {
        openPaymentModalWithDropdown('bank-modal');
    } else if (selectedPayment.value === 'wallet') {
        openPaymentModalWithDropdown('wallet-modal');
    }
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    // إزالة الإشعارات السابقة
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // إضافة التنسيقات
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#dc3545' : '#F5810D'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    // إزالة الإشعار تلقائياً بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// تحديث عدد المنتجات في السلة
function updateCartCount() {
    const totalItems = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}



// تحميل البيانات من localStorage إذا كانت متوفرة
function loadCartData() {
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
        try {
            const cartItems = JSON.parse(savedCart);
            if (cartItems.length > 0) {
                orderData.items = cartItems;
                renderOrderItems();
            }
        } catch (e) {
            console.log('خطأ في تحميل بيانات السلة:', e);
        }
    }
}

// عرض المنتجات في الطلب
function renderOrderItems() {
    const orderItemsContainer = document.querySelector('.order-items');
    if (!orderItemsContainer) return;

    orderItemsContainer.innerHTML = '';
    
    orderData.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="item-details">
                <h4>${item.name}</h4>
                <span class="item-quantity">الكمية: ${item.quantity}</span>
            </div>
            <div class="item-price">
                EGP ${item.price * item.quantity}
            </div>
        `;
        orderItemsContainer.appendChild(itemElement);
    });
}

// إضافة الرسوم المتحركة للعناصر
function addAnimations() {
    const elements = document.querySelectorAll('.billing-section, .summary-card');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// إضافة CSS للرسوم المتحركة
function addAnimationStyles() {
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
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin-right: 10px;
        }
        
        .form-group.focused label {
            color: #F5810D;
        }
        
        .payment-option.selected {
            background-color: #fff5f0;
            border-radius: 6px;
            margin: 0 -8px;
            padding: 12px 8px;
            border: 1px solid #F5810D;
        }
    `;
    document.head.appendChild(style);
}

// التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات
    loadCartData();
    
    // حساب المجاميع
    calculateTotals();
    
    // تحديث عدد السلة
    updateCartCount();
    
    // إضافة التأثيرات
    addFieldEffectsWithDropdown();
    addPaymentEffectsWithDropdown();
    addAnimations();
    addAnimationStyles();
    addExtraAnimationStyles();
    
    // إعداد الفورم المنبثقة
    setupPaymentForms();
    setupWalletEffects();
    
    // تهيئة القائمة المنسدلة
    initializeDropdown();
    
    // تعيين طريقة الدفع الافتراضية
    const defaultPayment = document.querySelector('input[name="payment"][value="cash"]');
    if (defaultPayment) {
        defaultPayment.checked = true;
        defaultPayment.closest('.payment-option').classList.add('selected');
    }
    
    // التعامل مع خطأ تحميل الشعار
    const logoImg = document.getElementById('logo-img');
    const logoText = document.getElementById('logo-text');
    
    if (logoImg) {
        logoImg.addEventListener('error', function() {
            logoImg.style.display = 'none';
            logoText.style.display = 'block';
        });
    }
    
    console.log("تم تحميل صفحة الدفع بنجاح");
});



// معالجة الطلب
function processOrder(paymentMethod, paymentData = null) {
    if (paymentMethod === 'cash') {
        const placeOrderBtn = document.querySelector('.place-order-btn');
        placeOrderBtn.classList.add('loading');
        placeOrderBtn.textContent = 'جاري معالجة الطلب...';
        placeOrderBtn.disabled = true;
        
        processOrderData(paymentMethod, paymentData, placeOrderBtn);
        return;
    }
    
    // للطرق الأخرى، إظهار حالة المعالجة داخل الفورم المنبثقة
    showProcessingInModal();
    processOrderData(paymentMethod, paymentData);
}

// إظهار حالة المعالجة داخل الفورم المنبثقة
function showProcessingInModal() {
    const activeModal = document.querySelector('.payment-modal.show');
    if (!activeModal) return;
    
    const modalContent = activeModal.querySelector('.modal-content');
    
    // إنشاء عنصر المعالجة
    const processingOverlay = document.createElement('div');
    processingOverlay.className = 'processing-overlay';
    processingOverlay.innerHTML = `
        <div class="processing-content">
            <div class="processing-spinner"></div>
            <h3>جاري معالجة الطلب...</h3>
            <p>يرجى الانتظار، لا تغلق هذه النافذة</p>
        </div>
    `;
    
    modalContent.appendChild(processingOverlay);
}

// معالجة بيانات الطلب
function processOrderData(paymentMethod, paymentData = null, placeOrderBtn = null) {
    // محاكاة إرسال الطلب
    setTimeout(() => {
        // جمع بيانات النموذج
        const formData = new FormData(document.getElementById('billing-form'));
        const orderDetails = {
            billingInfo: Object.fromEntries(formData),
            items: orderData.items,
            paymentMethod: paymentMethod,
            paymentData: paymentData,
            subtotal: orderData.subtotal,
            deliveryFee: orderData.deliveryFee,
            total: orderData.total,
            orderDate: new Date().toISOString()
        };

        // حفظ الطلب
        console.log('تفاصيل الطلب:', orderDetails);
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

        // إغلاق أي فورم مفتوحة
        closePaymentModalWithDropdown();

        // إظهار تأثيرات النجاح
        showSuccessAnimation();
        
        // إعادة تعيين الزر إذا كان موجوداً
        if (placeOrderBtn) {
            placeOrderBtn.classList.remove('loading');
            placeOrderBtn.textContent = 'تم إتمام الطلب ✓';
            placeOrderBtn.style.backgroundColor = '#10B981';
        }

    }, 2000);
}

// إظهار تأثيرات النجاح
function showSuccessAnimation() {
    // إنشاء شاشة النجاح
    const successScreen = document.createElement('div');
    successScreen.className = 'success-animation';
    successScreen.innerHTML = `
        <div class="success-icon">
            <i class="fas fa-check-circle"></i>
        </div>
        <div class="success-message">تم إتمام طلبك بنجاح!</div>
        <div class="success-submessage">سيتم التواصل معك قريباً لتأكيد التوصيل</div>
    `;
    
    document.body.appendChild(successScreen);
    
    // إضافة تأثير الكونفيتي
    createConfetti();
    
    // إزالة الشاشة والتوجيه بعد 4 ثواني
    setTimeout(() => {
        successScreen.style.animation = 'successFadeOut 0.5s ease-in forwards';
        setTimeout(() => {
            successScreen.remove();
            window.location.href = 'index.html';
        }, 500);
    }, 4000);
}

// إنشاء تأثير الكونفيتي
function createConfetti() {
    const colors = ['#F5810D', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
            
            document.body.appendChild(confetti);
            
            // إزالة الكونفيتي بعد انتهاء الرسوم المتحركة
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }, i * 100);
    }
}

// تنسيق رقم البطاقة
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}

// تنسيق تاريخ الانتهاء
function formatExpiryDate(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

// التحقق من صحة رقم البطاقة (خوارزمية Luhn)
function validateCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber.charAt(i));
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

// إضافة مستمعي الأحداث للفورم المنبثقة الجديدة
function setupPaymentForms() {
    // فورم التحويل البنكي الجديد
    setupBankForm();
    
    // فورم المحافظ الإلكترونية
    const walletForm = document.getElementById('wallet-form');
    if (walletForm) {
        walletForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const walletNumber = formData.get('walletNumber');
            const walletType = formData.get('walletType');
            
            if (!walletNumber || walletNumber.length < 11) {
                showNotification('رقم المحفظة غير صحيح', 'error');
                return;
            }
            
            const paymentData = {
                type: 'e_wallet',
                walletType: walletType,
                walletNumber: walletNumber.replace(/\d(?=\d{4})/g, '*')
            };
            
            processOrder('wallet', paymentData);
        });
        
        // تنسيق رقم المحفظة
        const walletNumberInput = document.getElementById('wallet-number');
        const walletPinInput = document.getElementById('wallet-pin');
        
        if (walletNumberInput) {
            walletNumberInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').substring(0, 11);
            });
        }
        
        if (walletPinInput) {
            walletPinInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '').substring(0, 4);
            });
        }
    }
}

// إعداد فورم التحويل البنكي الجديد
function setupBankForm() {
    // إعداد اختيار البطاقات
    const cardOptions = document.querySelectorAll('.card-option');
    cardOptions.forEach(option => {
        option.addEventListener('click', function() {
            selectCardType(this.dataset.card);
        });
    });
    
    // إعداد نموذج البيانات
    const bankForm = document.getElementById('bank-form');
    if (bankForm) {
        bankForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBankFormSubmit(this);
        });
        
        // تنسيق الحقول
        setupFormInputs();
    }
}

// اختيار نوع البطاقة
let selectedCardType = null;

function selectCardType(cardType) {
    selectedCardType = cardType;
    
    // إزالة التحديد من جميع البطاقات
    document.querySelectorAll('.card-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // تحديد البطاقة المختارة
    const selectedOption = document.querySelector(`[data-card="${cardType}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
    
    // الانتقال إلى خطوة إدخال البيانات
    setTimeout(() => {
        showCardDetailsStep();
        updateCardInputs(cardType);
    }, 300);
}

// إظهار خطوة إدخال بيانات البطاقة
function showCardDetailsStep() {
    const selectionStep = document.querySelector('.card-selection-step');
    const detailsStep = document.querySelector('.card-details-step');
    
    if (selectionStep && detailsStep) {
        selectionStep.style.display = 'none';
        detailsStep.style.display = 'block';
        
        // التركيز على أول حقل
        const firstInput = detailsStep.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

// العودة إلى اختيار البطاقة
function goBackToCardSelection() {
    const selectionStep = document.querySelector('.card-selection-step');
    const detailsStep = document.querySelector('.card-details-step');
    
    if (selectionStep && detailsStep) {
        detailsStep.style.display = 'none';
        selectionStep.style.display = 'block';
        
        // إعادة تعيين النموذج
        const form = document.getElementById('bank-form');
        if (form) {
            form.reset();
        }
        
        // إزالة مؤشر نوع البطاقة
        const indicator = document.querySelector('.card-type-indicator');
        if (indicator) {
            indicator.style.backgroundImage = '';
        }
    }
}

// تحديث حقول الإدخال حسب نوع البطاقة
function updateCardInputs(cardType) {
    const cardNumberInput = document.getElementById('card-number');
    const cvvInput = document.getElementById('cvv');
    const indicator = document.querySelector('.card-type-indicator');
    
    if (cardNumberInput && cvvInput) {
        switch (cardType) {
            case 'visa':
                cardNumberInput.placeholder = '4*** **** **** ****';
                cvvInput.placeholder = '123';
                cvvInput.maxLength = 3;
                if (indicator) {
                    indicator.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 16\'%3E%3Crect width=\'24\' height=\'16\' fill=\'%231a365d\'/%3E%3Ctext x=\'12\' y=\'10\' text-anchor=\'middle\' fill=\'white\' font-size=\'6\' font-weight=\'bold\'%3EVISA%3C/text%3E%3C/svg%3E")';
                }
                break;
            case 'mastercard':
                cardNumberInput.placeholder = '5*** **** **** ****';
                cvvInput.placeholder = '123';
                cvvInput.maxLength = 3;
                if (indicator) {
                    indicator.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 16\'%3E%3Crect width=\'24\' height=\'16\' fill=\'%232d3748\'/%3E%3Ccircle cx=\'8\' cy=\'8\' r=\'4\' fill=\'%23eb001b\'/%3E%3Ccircle cx=\'16\' cy=\'8\' r=\'4\' fill=\'%23f79e1b\'/%3E%3C/svg%3E")';
                }
                break;
            case 'amex':
                cardNumberInput.placeholder = '3*** ****** *****';
                cvvInput.placeholder = '1234';
                cvvInput.maxLength = 4;
                if (indicator) {
                    indicator.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 16\'%3E%3Crect width=\'24\' height=\'16\' fill=\'%232c5282\'/%3E%3Ctext x=\'12\' y=\'10\' text-anchor=\'middle\' fill=\'white\' font-size=\'5\' font-weight=\'bold\'%3EAMEX%3C/text%3E%3C/svg%3E")';
                }
                break;
            case 'discover':
                cardNumberInput.placeholder = '6*** **** **** ****';
                cvvInput.placeholder = '123';
                cvvInput.maxLength = 3;
                if (indicator) {
                    indicator.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 16\'%3E%3Crect width=\'24\' height=\'16\' fill=\'%23e53e3e\'/%3E%3Ctext x=\'12\' y=\'10\' text-anchor=\'middle\' fill=\'white\' font-size=\'4\' font-weight=\'bold\'%3EDISCOVER%3C/text%3E%3C/svg%3E")';
                }
                break;
        }
    }
}

// إعداد حقول الإدخال
function setupFormInputs() {
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry-date');
    const cvvInput = document.getElementById('cvv');
    const cardholderInput = document.getElementById('cardholder-name');
    
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function() {
            formatCardNumber(this);
        });
    }
    
    if (expiryInput) {
        expiryInput.addEventListener('input', function() {
            formatExpiryDate(this);
        });
    }
    
    if (cvvInput) {
        cvvInput.addEventListener('input', function() {
            const maxLength = selectedCardType === 'amex' ? 4 : 3;
            this.value = this.value.replace(/\D/g, '').substring(0, maxLength);
        });
    }
    
    if (cardholderInput) {
        cardholderInput.addEventListener('input', function() {
            // تحويل إلى أحرف كبيرة كما هو معتاد في البطاقات
            this.value = this.value.toUpperCase();
        });
    }
}

// معالجة إرسال نموذج البنك
function handleBankFormSubmit(form) {
    const formData = new FormData(form);
    const cardNumber = formData.get('cardNumber');
    const expiryDate = formData.get('expiryDate');
    const cvv = formData.get('cvv');
    const cardholderName = formData.get('cardholderName');
    
    // التحقق من صحة البيانات
    if (!selectedCardType) {
        showNotification('يرجى اختيار نوع البطاقة', 'error');
        goBackToCardSelection();
        return;
    }
    
    if (!validateCardNumber(cardNumber)) {
        showNotification('رقم البطاقة غير صحيح', 'error');
        return;
    }
    
    if (!validateExpiryDate(expiryDate)) {
        showNotification('تاريخ انتهاء البطاقة غير صحيح', 'error');
        return;
    }
    
    if (!cvv || cvv.length < 3) {
        showNotification('رمز الأمان غير صحيح', 'error');
        return;
    }
    
    if (!cardholderName || cardholderName.trim().length < 2) {
        showNotification('اسم حامل البطاقة مطلوب', 'error');
        return;
    }
    
    // إظهار حالة التحميل
    showSubmitLoading(true);
    
    const paymentData = {
        type: 'bank_transfer',
        cardType: selectedCardType,
        cardNumber: cardNumber.replace(/\s/g, '').replace(/\d(?=\d{4})/g, '*'),
        cardholderName: cardholderName,
        expiryDate: expiryDate
    };
    
    processOrder('bank', paymentData);
}

// إظهار/إخفاء حالة التحميل في زر الإرسال
function showSubmitLoading(show) {
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    
    if (show) {
        btnText.style.display = 'none';
        btnIcon.style.display = 'none';
        btnLoader.style.display = 'flex';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        btnIcon.style.display = 'inline';
        btnLoader.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// التحقق من صحة تاريخ الانتهاء
function validateExpiryDate(expiry) {
    if (!expiry || expiry.length !== 5) return false;
    
    const [month, year] = expiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt('20' + year);
    
    if (monthNum < 1 || monthNum > 12) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    
    return true;
}

// فتح فورم التحويل البنكي
function openBankModal() {
    const modal = document.getElementById('bank-modal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // إعادة تعيين الفورم إلى الخطوة الأولى
        const selectionStep = document.querySelector('.card-selection-step');
        const detailsStep = document.querySelector('.card-details-step');
        
        if (selectionStep && detailsStep) {
            selectionStep.style.display = 'block';
            detailsStep.style.display = 'none';
        }
        
        // إعادة تعيين المتغيرات
        selectedCardType = null;
        
        // إزالة التحديد من البطاقات
        document.querySelectorAll('.card-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // إعادة تعيين النموذج
        const form = document.getElementById('bank-form');
        if (form) {
            form.reset();
        }
        
        // إخفاء حالة التحميل
        showSubmitLoading(false);
    }
}

// إضافة تأثيرات للمحافظ الإلكترونية
function setupWalletEffects() {
    const walletOptions = document.querySelectorAll('.wallet-option');
    
    walletOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        const label = option.querySelector('label');
        
        option.addEventListener('click', function() {
            // إزالة التحديد من جميع الخيارات
            walletOptions.forEach(opt => {
                opt.classList.remove('selected');
                opt.querySelector('input[type="radio"]').checked = false;
            });
            
            // إضافة التحديد للخيار الحالي
            this.classList.add('selected');
            radio.checked = true;
            
            // تأثير بصري
            label.style.transform = 'scale(0.95)';
            setTimeout(() => {
                label.style.transform = 'scale(1)';
            }, 150);
        });
    });
}

// إضافة CSS للتأثيرات الإضافية
function addExtraAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes successFadeOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.8);
            }
        }
        
        .wallet-option.selected label {
            animation: walletPulse 0.6s ease-out;
        }
        
        @keyframes walletPulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }
        
        .payment-form input:focus {
            animation: inputFocus 0.3s ease-out;
        }
        
        @keyframes inputFocus {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.02);
            }
            100% {
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}

// إضافة مستمع للضغط على Escape لإغلاق الفورم
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePaymentModal();
    }
});

// إصلاح سلوك القائمة المنسدلة للفئات - حل شامل
function fixDropdownBehavior() {
    // البحث عن جميع العناصر المرتبطة بالقائمة المنسدلة
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        if (toggle && menu) {
            // إزالة جميع الأحداث الموجودة
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            
            // إضافة الأحداث الجديدة
            newToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // لا نفعل شيء - نترك CSS hover يتولى الأمر
            });
            
            // التأكد من عمل hover بشكل صحيح
            dropdown.addEventListener('mouseenter', function() {
                this.classList.add('force-hover');
            });
            
            dropdown.addEventListener('mouseleave', function() {
                this.classList.remove('force-hover');
            });
        }
    });
}

// تطبيق الإصلاح عند تحميل الصفحة وبعد تحميل المحتوى
document.addEventListener('DOMContentLoaded', fixDropdownBehavior);
window.addEventListener('load', fixDropdownBehavior);

// تطبيق الإصلاح فوراً إذا كانت الصفحة محملة بالفعل
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fixDropdownBehavior();
}









// إعداد القائمة المنسدلة للفئات
function initializeDropdown() {
    const dropdown = document.querySelector('.dropdown');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (!dropdown || !dropdownToggle || !dropdownMenu) {
        return;
    }
    
    // إزالة أي مستمعات أحداث سابقة
    dropdown.removeEventListener('mouseenter', handleMouseEnter);
    dropdown.removeEventListener('mouseleave', handleMouseLeave);
    dropdownToggle.removeEventListener('click', handleClick);
    
    // إضافة مستمعات الأحداث الجديدة
    dropdown.addEventListener('mouseenter', handleMouseEnter);
    dropdown.addEventListener('mouseleave', handleMouseLeave);
    dropdownToggle.addEventListener('click', handleClick);
    
    // إضافة مستمع للنقر خارج القائمة
    document.addEventListener('click', function(event) {
        if (!dropdown.contains(event.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
}

// دالة التعامل مع دخول الماوس
function handleMouseEnter() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.style.display = 'block';
    }
}

// دالة التعامل مع خروج الماوس
function handleMouseLeave() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.style.display = 'none';
    }
}

// دالة التعامل مع النقر
function handleClick(event) {
    event.preventDefault();
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        if (dropdownMenu.style.display === 'block') {
            dropdownMenu.style.display = 'none';
        } else {
            dropdownMenu.style.display = 'block';
        }
    }
}

// إعادة تهيئة القائمة المنسدلة بعد أي تفاعل
function reinitializeDropdown() {
    setTimeout(initializeDropdown, 100);
}

// تحديث دالة addFieldEffects لإعادة تهيئة القائمة
function addFieldEffectsWithDropdown() {
    const inputs = document.querySelectorAll('.form-group input');
    
    inputs.forEach(input => {
        // تأثير التركيز
        input.addEventListener('focus', function() {
            this.parentElement.classList.add("focused");
            reinitializeDropdown();
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove("focused");
            reinitializeDropdown();
        });

        // التحقق الفوري أثناء الكتابة
        input.addEventListener('input', function() {
            if (this.hasAttribute("required") && this.value.trim()) {
                this.style.borderColor = "#10B981";
            }
            reinitializeDropdown();
        });
    });
}

// تحديث دالة addPaymentEffects لإعادة تهيئة القائمة
function addPaymentEffectsWithDropdown() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        const label = option.querySelector('label');
        
        option.addEventListener('click', function() {
            // إزالة التحديد من جميع الخيارات
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            
            // إضافة التحديد للخيار الحالي
            this.classList.add('selected');
            radio.checked = true;
            
            reinitializeDropdown();
        });
    });
}

// تحديث دالة openPaymentModal لإعادة تهيئة القائمة
function openPaymentModalWithDropdown(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("show");
        document.body.style.overflow = "hidden";
        
        // إضافة مستمع للإغلاق بالضغط خارج الفورم
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                closePaymentModalWithDropdown();
            }
        });
        
        reinitializeDropdown();
    }
}

// تحديث دالة closePaymentModal لإعادة تهيئة القائمة
function closePaymentModalWithDropdown() {
    const modals = document.querySelectorAll(".payment-modal");
    modals.forEach(modal => {
        modal.classList.remove("show");
    });
    document.body.style.overflow = "auto";
    
    reinitializeDropdown();
}

