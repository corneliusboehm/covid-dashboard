
$('#contactForm').submit(function(e) {
    e.preventDefault();
    $.ajax({
        url: '/mail',
        type: 'post',
        data: $('#contactForm').serialize(),
        success: function() {
            // Reset form fields
            $('#contactForm')[0].reset()

            // Show success alert
            $('#alertMessageSuccess').fadeIn('fast');
            setTimeout('$("#alertMessageSuccess").fadeOut("fast")', 4000);
        },
        error: function() {
            // Show error alert
            $('#alertMessageError').fadeIn('fast');
            setTimeout('$("#alertMessageError").fadeOut("fast")', 4000);
        }
    });
});
