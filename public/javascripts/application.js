// eslint-disable-next-line no-extra-semi
;(function($) {
  function request(url, type, data) {
    return $.post({
      url,
      type,
      data,
      success: data => console.log(data),
      error: (xhr, status, text) => console.log(status, text)
    })
  }

  function run() {
    // request('/api/v1/clients/add', 'POST', {
    //   n: 2
    // })
    request('/api/v1/clients/remove', 'POST', {
      ports: [9091, 9092]
    })
  }

  $(function() {
    run()
  })
})(jQuery)
