const button = document.getElementById('btnPrint');

function generatePDF() {
				// Choose the element that your content will be rendered to.
				const element = document.getElementById('invoice-content');
				// Choose the element and save the PDF for your user.
				window.html2pdf().from(element).save();
			}
button.addEventListener('click', generatePDF);