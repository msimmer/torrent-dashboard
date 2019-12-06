// eslint-disable-next-line no-extra-semi
(function($) {
  function request(url, type, data) {
    showSpinner();
    return $.ajax({
      url,
      type,
      data,
      success: data => {
        const { code, message } = data;
        if (typeof code !== "undefined" && code !== 0) {
          return flash({
            status: "error",
            message
          });
        }
        return flash({
          status: "success",
          message: message ? message : "Success"
        });
      },
      error: (xhr, status, text) => {
        flash({
          status: "error",
          message: "There was an unhandled error event"
        });

        console.log("ERR! %s; %s", status, text);
      }
    }).always(function() {
      hideSpinner();
      $('input[type="checkbox"]').prop("checked", false);
    });
  }

  function showSpinner() {
    $(".overlay").show();
  }

  function hideSpinner() {
    $(".overlay").hide();
  }

  function flashClose() {
    const elem = $(".flash");
    elem.addClass("hidden");
    elem.find(".flash__message").text("");
    elem.removeClass(status);
  }

  function flash({ status, message }) {
    const elem = $(".flash");
    elem.removeClass("hidden");
    elem.find(".flash__message").text(message);
    elem.addClass(status);

    if (status === "error") return;

    setTimeout(flashClose, 3000);
  }

  function toggleGroup(name) {
    const all = `input[name="${name}"]`;
    const some = `input[name="${name}[]"]`;

    $(document).on("change", some, function() {
      if ($(`input[name="${name}[]"]:checked`).length) {
        $(all).prop("indeterminate", true);
        return;
      }

      $(all).prop("indeterminate", false);
    });

    $(document).on("change", all, function(e) {
      const { checked } = e.target;
      $(some).prop("checked", checked);
    });
  }

  function enableGroup(name, id) {
    $("input").prop("indeterminate", false);

    const elem = $(`[data-${name}="${id}"]`);

    elem.addClass("active");
    elem.attr(`data-${name}-active`, 1);

    elem
      .find(".indicator")
      .removeClass("indicator--inactive")
      .addClass("indicator--active");
  }

  function disableGroup(name, id) {
    $("input").prop("indeterminate", false);

    const elem = $(`[data-${name}="${id}"]`);

    elem.removeClass("active");
    elem.attr(`data-${name}-active`, 0);

    elem
      .find(".indicator")
      .addClass("indicator--inactive")
      .removeClass("indicator--active");
  }

  $(function() {
    // UI
    $(".flash__close").on("click", flashClose);

    // Upload
    $('input[name="torrent"]').on("change", function(e) {
      e.preventDefault();

      showSpinner();

      const input = $(this);
      const file = input.get(0).files[0];
      const uri = "/api/v1/torrents/new";
      const xhr = new XMLHttpRequest();
      const fd = new FormData();

      xhr.open("POST", uri, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) hideSpinner();
        if (xhr.readyState == 4 && xhr.status == 200) {
          flash({
            status: "success",
            message: "File successfully uploaded"
          });

          input.val("");

          // Update table
          $.get("/").then(resp => {
            const elem = $(resp).find(".table__torrents");
            $(".table__torrents").replaceWith(elem);
          });
        }
      };

      fd.append("torrent", file);
      xhr.send(fd);
    });

    toggleGroup("clients");
    toggleGroup("torrents");

    // Client actions
    $(document).on("click", ".actions__clients--activate", function(e) {
      e.preventDefault();

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      );

      if (!clients.length) return;

      request("/api/v1/clients/start", "POST", { clients }).then(() =>
        clients.forEach(id => enableGroup("clients", id))
      );
    });

    $(document).on("click", ".actions__clients--deactivate", function(e) {
      e.preventDefault();

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      );

      if (!clients.length) return;

      request("/api/v1/clients/stop", "POST", { clients }).then(() =>
        clients.forEach(id => disableGroup("clients", id))
      );
    });

    // Torrent actions
    $(document).on("click", ".actions__torrents--activate", function(e) {
      e.preventDefault();

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      );

      const torrents = $.map(
        $('input[name="torrents[]"]:checked'),
        elem => elem.value
      );

      if (!clients.length || !torrents.length) return;

      request("/api/v1/torrents/add", "POST", { clients, torrents }).then(
        () => {
          torrents.forEach(id => enableGroup("torrent", id));

          $.get("/").then(resp => {
            const selector = ".table__clients";
            const elem = $(resp).find(selector);
            $(selector).replaceWith(elem);
          });
        }
      );
    });

    $(document).on("click", ".actions__torrents--deactivate", function(e) {
      e.preventDefault();

      const clients = $.map(
        $('input[name="clients[]"]:checked'),
        elem => elem.value
      );

      const torrents = $.map(
        $('input[name="torrents[]"]:checked'),
        elem => elem.value
      );

      if (!clients.length || !torrents.length) return;

      request("/api/v1/torrents/remove", "POST", {
        clients,
        torrents
      }).then(() => {
        torrents.forEach(id => disableGroup("torrent", id));

        $.get("/").then(resp => {
          const selector = ".table__clients";
          const elem = $(resp).find(selector);
          $(selector).replaceWith(elem);
        });
      });
    });

    $(document).on("click", ".actions__torrent--deactivate", function(e) {
      e.preventDefault();
      const _this = $(this);

      const clientId = _this.attr("data-client");
      const torrentId = _this.attr("data-torrent");
      const parentSelector = `[data-clients="${clientId}"]`;

      const clients = [clientId];
      const torrents = [torrentId];

      request("/api/v1/torrents/remove", "POST", {
        clients,
        torrents
      }).then(() => {
        $.get("/").then(resp => {
          const elem = $(resp).find(parentSelector);
          $(parentSelector).replaceWith(elem);
        });
      });
    });

    $(document).on("click", "[data-download]", function(e) {
      e.preventDefault();
      const name = $(this).attr("data-download");

      $.get(`/api/v1/files/${name}`).then(resp => {
        const url = window.URL.createObjectURL(new Blob([resp]));
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", name);

        document.body.appendChild(link);

        link.click();
        link.parentNode.removeChild(link);
      });
    });

    $(document).on(
      "change",
      "[name='torrents[]'], [name='clients[]'], [name='torrents'], [name='clients']",
      function() {
        const checkedTorrents = $("[name='torrents[]']:checked").length;
        const checkedClients = $("[name='clients[]']:checked").length;
        if (checkedTorrents && checkedClients) {
          $(".actions__torrents--activate").removeAttr("disabled");
          $(".actions__torrents--deactivate").removeAttr("disabled");
        } else {
          $(".actions__torrents--activate").attr("disabled", true);
          $(".actions__torrents--deactivate").attr("disabled", true);
        }
      }
    );

    $(document).on(
      "change",
      "[name='clients[]'], [name='clients']",
      function() {
        const checkedClients = $("[name='clients[]']:checked").length;
        if (checkedClients) {
          $(".actions__clients--activate").removeAttr("disabled");
          $(".actions__clients--deactivate").removeAttr("disabled");
        } else {
          $(".actions__clients--activate").attr("disabled", true);
          $(".actions__clients--deactivate").attr("disabled", true);
        }
      }
    );
  });
})(jQuery);
