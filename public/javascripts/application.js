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

  function flash({ status, message }) {
    const elem = $('.flash')
    elem.removeClass('hidden')
    elem.find('.flash__message').text(message)
    elem.addClass(status)
  }

  function toggleGroup(name) {
    const all = $(`input[name="${name}"]`)
    const some = $(`input[name="${name}[]"]`)

    some.on('change', function() {
      if ($(`input[name="${name}[]"]:checked`).length) {
        all.prop('indeterminate', true)
        return
      }

      all.prop('indeterminate', false)
    })

    $(`input[name="${name}"]`).on('change', function(e) {
      const { checked } = e.target
      some.prop('checked', checked)
    })
  }

  function enableGroup(name, id) {
    const elem = $(`[data-${name}="${id}"]`)
    elem.addClass('active')
    elem.attr(`data-${name}-active`, 1)
    elem
      .find('.indicator')
      .removeClass('indicator--inactive')
      .addClass('indicator--active')
  }

  function disableGroup(name, id) {
    const elem = $(`[data-${name}="${id}"]`)
    elem.removeClass('active')
    elem.attr(`data-${name}-active`, 0)
    elem
      .find('.indicator')
      .addClass('indicator--inactive')
      .removeClass('indicator--active')
  }

  $(function() {
    // Upload
    $('form[name="torrents"]').on('submit', function(e) {
      e.preventDefault()

      const input = $(this).find('[type="file"]')
      const file = input.get(0).files[0]
      const uri = $(this).attr('action')
      const xhr = new XMLHttpRequest()
      const fd = new FormData()

      xhr.open('POST', uri, true)
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          // const response = xhr.responseText
          // console.log(response)

          flash({
            status: 'success',
            message: 'File successfully uploaded'
          })

          input.val('')
        }
      }
      fd.append('torrent', file)
      xhr.send(fd)
    })

    toggleGroup('ports')
    toggleGroup('torrents')

    // Client actions
    $('.actions__clients--activate').on('click', function(e) {
      e.preventDefault()

      const ports = $.map($('tr[data-port-active="0"]').find('input[name="ports[]"]:checked'), function(elem) {
        return elem.value
      })

      if (!ports.length) return

      request('/api/v1/clients/start', 'POST', { ports }).then(() => ports.forEach(id => enableGroup('port', id)))
    })

    $('.actions__clients--deactivate').on('click', function(e) {
      e.preventDefault()

      const ports = $.map($('tr[data-port-active="1"]').find('input[name="ports[]"]:checked'), function(elem) {
        return elem.value
      })

      if (!ports.length) return

      request('/api/v1/clients/stop', 'POST', { ports }).then(() => ports.forEach(id => disableGroup('port', id)))
    })

    // Torrent actions
    $('.actions__torrents--activate').on('click', function(e) {
      e.preventDefault()

      const torrents = $.map($('tr[data-torrent-active="0"]').find('input[name="torrents[]"]:checked'), function(elem) {
        return elem.value
      })

      if (!torrents.length) return

      request('/api/v1/torrents/add', 'POST', { torrents }).then(() =>
        torrents.forEach(id => enableGroup('torrent', id))
      )
    })

    $('.actions__torrents--deactivate').on('click', function(e) {
      e.preventDefault()

      const torrents = $.map($('tr[data-torrent-active="1"]').find('input[name="torrents[]"]:checked'), function(elem) {
        return elem.value
      })

      if (!torrents.length) return

      request('/api/v1/torrents/remove', 'POST', { torrents }).then(() =>
        torrents.forEach(id => disableGroup('torrent', id))
      )
    })
  })
})(jQuery)
