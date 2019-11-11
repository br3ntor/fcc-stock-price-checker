$(function() {
  $('#testForm').submit(function(e) {
    $.ajax({
      url: '/api/stock-prices',
      type: 'get',
      data: $('#testForm').serializeArray(),
      success: function(data) {
        $('#jsonResult').text(JSON.stringify(data));
      }
    });
    e.preventDefault();
  });
  $('#testForm2').submit(function(e) {
    $.ajax({
      url: '/api/stock-prices',
      type: 'get',
      data: $('#testForm2').serializeArray(),
      success: function(data) {
        $('#jsonResult').text(JSON.stringify(data));
      }
    });
    e.preventDefault();
  });
});
