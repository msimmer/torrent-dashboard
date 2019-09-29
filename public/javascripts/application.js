// eslint-disable-next-line no-extra-semi
;(function($) {
  function request(url, type, data) {
    return $.post({
      url,
      type,
      data,
      success: data => console.log(data),
      error: (xhr, status, text) => console.log('ERR! %s; %s', status, text)
    })
  }

  function flash({ status, message }) {
    const elem = $('.flash')
    elem.removeClass('hidden')
    elem.find('.flash__message').text(message)
    elem.addClass(status)
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

    toggleGroup('ports')
    toggleGroup('torrents')

    // Client actions
    $('.actions__clients--activate').on('click', function(e) {
      e.preventDefault()

      const ports = $.map(
        $('tr[data-port-active="0"]').find('input[name="ports[]"]:checked'),
        elem => elem.value
      )

      if (!ports.length) return

      request('/api/v1/clients/start', 'POST', { ports }).then(() =>
        ports.forEach(id => enableGroup('port', id))
      )
    })

    $('.actions__clients--deactivate').on('click', function(e) {
      e.preventDefault()

      const ports = $.map(
        $('tr[data-port-active="1"]').find('input[name="ports[]"]:checked'),
        elem => elem.value
      )

      if (!ports.length) return

      request('/api/v1/clients/stop', 'POST', { ports }).then(() =>
        ports.forEach(id => disableGroup('port', id))
      )
    })

    // Torrent actions
    $('.actions__torrents--activate').on('click', function(e) {
      e.preventDefault()

      const torrents = $.map(
        $('tr[data-torrent-active="0"]').find(
          'input[name="torrents[]"]:checked'
        ),
        elem => elem.value
      )

      if (!torrents.length) return

      request('/api/v1/torrents/add', 'POST', { torrents }).then(() =>
        torrents.forEach(id => enableGroup('torrent', id))
      )
    })

    $('.actions__torrents--deactivate').on('click', function(e) {
      e.preventDefault()

      const torrents = $.map(
        $('tr[data-torrent-active="1"]').find(
          'input[name="torrents[]"]:checked'
        ),
        elem => elem.value
      )

      if (!torrents.length) return

      request('/api/v1/torrents/remove', 'POST', { torrents }).then(() =>
        torrents.forEach(id => disableGroup('torrent', id))
      )
    })

    // Tabs
    $('.toggle').on('click', function() {
      const index = $(this).attr('data-toggle')

      $(`[data-toggle="${index}"]`).addClass('active')
      $(`[data-tab="${index}"]`).addClass('active')

      $('[data-toggle]')
        .not(`[data-toggle="${index}"]`)
        .removeClass('active')

      $('[data-tab]')
        .not(`[data-tab="${index}"]`)
        .removeClass('active')
    })
  })
})(jQuery)
