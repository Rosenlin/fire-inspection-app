document.addEventListener('DOMContentLoaded', () => {
    // Form elements
    const inspectionForm = document.getElementById('inspectionForm');
    const submitBtn = document.getElementById('submitBtn');
    const spinner = submitBtn.querySelector('.spinner-border');
    const buttonText = submitBtn.querySelector('.button-text');
    const alertContainer = document.getElementById('alert-container');

    // Modal and QR Scanner elements
    const qrScannerModalEl = document.getElementById('qrScannerModal');
    const qrScannerModal = new bootstrap.Modal(qrScannerModalEl);
    const qrReaderDiv = document.getElementById('qr-reader');
    let html5QrCode;

    // Function to display Bootstrap alerts
    const showAlert = (message, type) => {
        alertContainer.innerHTML = ''; // Clear previous alerts
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');
        alertContainer.append(wrapper);
    };

    // Form submission event
    inspectionForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const location = document.getElementById('location').value.trim();
        const inspector = document.getElementById('inspector').value.trim();
        const remarks = Array.from(document.querySelectorAll('input[name="remarks"]:checked')).map(checkbox => checkbox.value);

        if (!location || !inspector) {
            showAlert('請填寫「地點」和「檢查人」欄位。', 'danger');
            return;
        }

        // Start loading state
        submitBtn.disabled = true;
        spinner.style.display = 'inline-block';
        buttonText.textContent = '提交中...';

        const data = {
            location,
            inspector,
            remarks: remarks.length > 0 ? remarks : ['正常']
        };

        fetch('/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || '伺服器錯誤') });
            }
            return response.json();
        })
        .then(data => {
            showAlert('點檢表已成功提交！', 'success');
            inspectionForm.reset();
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(`提交失敗: ${error.message}`, 'danger');
        })
        .finally(() => {
            // End loading state
            submitBtn.disabled = false;
            spinner.style.display = 'none';
            buttonText.textContent = '提交';
        });
    });

    // --- QR Code Scanner Modal Logic ---

    // Function to start the scanner
    const startScanner = () => {
        // Use the same instance to avoid re-creating it
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }

        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (qrCodeMessage) => {
                // On successful scan
                document.getElementById('location').value = qrCodeMessage;
                qrScannerModal.hide(); // Hide the modal
                showAlert('QR Code 掃描成功！', 'success');
            },
            (errorMessage) => {
                // This callback is called frequently when no QR code is found.
                // We can ignore it to avoid console spam.
            }
        ).catch((err) => {
            console.error(`Unable to start scanning, error: ${err}`);
            showAlert('無法啟動相機進行掃描，請確認已授權相機權限。', 'danger');
        });
    };

    // Function to stop the scanner
    const stopScanner = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop()
                .then(() => console.log("QR Code scanning stopped."))
                .catch(err => console.error("Failed to stop QR code scanner.", err));
        }
    };

    // Event listener for when the modal is shown
    qrScannerModalEl.addEventListener('shown.bs.modal', function () {
        startScanner();
    });

    // Event listener for when the modal is hidden
    qrScannerModalEl.addEventListener('hidden.bs.modal', function () {
        stopScanner();
    });
});