(function($){

  $(document).ready(function() {
    $('ul.accordion').accordion();
    $(function(){
      $('ul.accordion li a').eq(0).trigger('click');
    });
  }); 
})(jQuery);


