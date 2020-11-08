
$('#contactForm').submit(function(e) {
    e.preventDefault();
    $.ajax({
        url: '/mail',
        type: 'post',
        data: $('#contactForm').serialize(),
        success: function() {
            console.log('Message sent successfully')
        }
    });
});
