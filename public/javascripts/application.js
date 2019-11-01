// eslint-disable-next-line no-extra-semi
;(function($) {
  function request(url, type, data) {
    showSpinner()
    return $.ajax({
      url,
      type,
      data,
      success: data => {
        const { code, message } = data
        if (typeof code !== 'undefined' && code !== 0) {
          return flash({
            status: 'error',
            message
          })
        }
        return flash({
          status: 'success',
          message: message ? message : 'Success'
        })
      },
      error: (xhr, status, text) => {
        flash({
          status: 'error',
          message: 'There was an unhandled error event'
        })

        console.log('ERR! %s; %s', status, text)
      }
    }).always(function() {
      hideSpinner()
      $('input[type="checkbox"]').prop('checked', false)
    })
  }

  function showSpinner() {
    $('.overlay').show()
  }

  function hideSpinner() {
    $('.overlay').hide()
  }

  function flashClose() {
    const elem = $('.flash')
    elem.addClass('hidden')
    elem.find('.flash__message').text('')
    elem.removeClass(status)
  }

  function flash({ status, message }) {
    const elem = $('.flash')
    elem.removeClass('hidden')
    elem.find('.flash__message').text(message)
    elem.addClass(status)

    if (status === 'error') return

    setTimeout(flashClose, 3000)
  }

  function toggleGroup(name) {
    const all = `input[name="${name}"]`
    const some = `input[name="${name}[]"]`

    $(document).on('change', some, function() {
      if ($(`input[name="${name}[]"]:checked`).length) {
        $(all).prop('indeterminate', true)
        return
      }

      $(all).prop('indeterminate', false)
    })

    $(document).on('change', all, function(e) {
      const { checked } = e.target
      $(some).prop('checked', checked)
    })
  }

  function enableGroup(name, id) {
    $('input').prop('indeterminate', false)

    const elem = $(`[data-${name}="${id}"]`)
    elem.addClass('active')
    elem.attr(`data-${name}-active`, 1)
    elem
      .find('.indicator')
      .removeClass('indicator--inactive')
      .addClass('indicator--active')
  }

  function disableGroup(name, id) {
    $('input').prop('indeterminate', false)

    const elem = $(`[data-${name}="${id}"]`)
    elem.removeClass('active')
    elem.attr(`data-${name}-active`, 0)
    elem
      .find('.indicator')
      .addClass('indicator--inactive')
      .removeClass('indicator--active')
  }

  $(function() {
    // UI
    $('.flash__close').on('click', flashClose)

    // Upload
    $('input[name="torrent"]').on('change', function(e) {
      e.preventDefault()

      const input = $(this)
      const file = input.get(0).files[0]
      const uri = '/api/v1/torrents/new'
      const xhr = new XMLHttpRequest()
      const fd = new FormData()

      xhr.open('POST', uri, true)
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          const { id, name } = JSON.parse(xhr.responseText)

          flash({
            status: 'success',
            message: 'File successfully uploaded'
          })

          input.val('')

          $('.table__torrents tbody').append(`
            <tr data-torrent-active="0" data-torrent="${id}">
              <td class="col-80">${name}</td>
              <td class="col-10"><span class="indicator indicator--inactive" data-indicator-active="0" data-id="${id}"></span></td>
              <td class="col-10"><input type="checkbox" name="torrents[]" value="${id}"></td>
            </tr>
          `)
        }
      }

      fd.append('torrent', file)
      xhr.send(fd)
    })

    toggleGroup('clients')
    toggleGroup('torrents')

    // Client actions
    $('.actions__clients--activate').on('click', function(e) {
      e.preventDefault()

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      )

      if (!clients.length) return

      request('/api/v1/clients/start', 'POST', { clients }).then(() =>
        clients.forEach(id => enableGroup('clients', id))
      )
    })

    $('.actions__clients--deactivate').on('click', function(e) {
      e.preventDefault()

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      )

      if (!clients.length) return

      request('/api/v1/clients/stop', 'POST', { clients }).then(() =>
        clients.forEach(id => disableGroup('clients', id))
      )
    })

    // Torrent actions
    $('.actions__torrents--activate').on('click', function(e) {
      e.preventDefault()

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      )

      const torrents = $.map(
        $('input[name="torrents[]"]:checked'),
        elem => elem.value
      )

      if (!clients.length || !torrents.length) return

      request('/api/v1/torrents/add', 'POST', { clients, torrents }).then(() =>
        torrents.forEach(id => enableGroup('torrent', id))
      )
    })

    $('.actions__torrents--deactivate').on('click', function(e) {
      e.preventDefault()

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      )

      const torrents = $.map(
        $('input[name="torrents[]"]:checked'),
        elem => elem.value
      )

      if (!clients.length || !torrents.length) return

      request('/api/v1/torrents/remove', 'POST', { clients, torrents }).then(
        () => torrents.forEach(id => disableGroup('torrent', id))
      )
    })

    $('.actions__torrent--deactivate').on('click', function(e) {
      e.preventDefault()

      const clients = [$(this).attr('data-client')]
      const torrents = [$(this).attr('data-torrent')]

      request('/api/v1/torrents/remove', 'POST', { clients, torrents }).then(
        () => {}
      )
    })
  })
})(jQuery)
