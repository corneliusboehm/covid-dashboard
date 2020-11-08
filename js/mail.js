
$('#contactForm').submit(function(e) {
    e.preventDefault();
    $.ajax({
        url: 'https://0.0.0.0:1024/mail',
        type: 'post',
        data: $('#contactForm').serialize(),
        success: function() {
            console.log('Message sent successfully')
        }
    });
});
