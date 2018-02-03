import "phoenix_html"
import "autolink-js"

const {Howl} = require('howler');
import {Socket} from "phoenix"
import cacheDB from "./database"
import xss from "xss"
import Noty from 'noty';
import mitt from 'mitt'

const emitter = mitt()

const onFocus = () => {
  emitter.emit('isPageActiveOn', true)
}

$(window).focus(function() {
  emitter.off('isPageActiveEmit', onFocus)
  emitter.on('isPageActiveEmit', onFocus)
});

const onBlur = () => {
  emitter.emit('isPageActiveOn', false)
}

$(window).blur(function() {
  emitter.off('isPageActiveEmit', onBlur)
  emitter.on('isPageActiveEmit', onBlur)
});

const sound = new Howl({
  src: ['sound/notification.mp3']
});

$('#msg').attr('disabled', 'disabled')
$('#msg').val('')

let socket = new Socket("/socket", {params: {token: window.userToken}})

socket.connect()

let channel = socket.channel("room:" + $('meta[name=id]').attr('content'), {})

setInterval(() => {
  $('.time').each((i, el) => $(el).text(moment($(el).attr('date')).fromNow()))
}, 1000)

const tabWidthUpdate = () => {
  let total = 0

  $('.userTabs li').each((i, el) => total+=$(el).width())

  total += 60

  $('.userTabs').css({
    width: total+'px'
  })
}

channel.join()
  .receive("ok", resp => {

    setInterval(() => {
      const code = $('meta[name=id]').attr('content')

      channel.push("heartbeat", {code: code})
    }, 3000)

  })

const tabClick = () => {
  $('.nav-tabs a').off('click')

  $('.nav-tabs a').on('click', function(event){
    if ($(event.target).parent().attr('room')) {
      $('#msg').removeAttr('disabled')

      const code = $(event.target).attr('code')

      $('#notify-'+code).text('')

      if (cacheDB.getRoomInput(code).text.length) {
        $('#msg').val(cacheDB.getRoomInput(code).text)
      } else {
        $('#msg').val($('#roomMenu-'+code).attr('input-text'))
      }

      $('#msg').focus()

      const interval = setInterval(() => {
        if ($('#menu-'+code).hasClass('active')) {
          $(window).scrollTop(parseInt($('#roomMenu-'+code).attr('sp')) || 0)
          clearInterval(interval)
        }
      }, 1)

      // notify reset
      cacheDB.setRoomNotify(code, 0)
    } else {
      $('#msg').attr('disabled', 'disabled')
      $('#msg').val('')
    }
  });

  try {
    if ("ga" in window) {
      var tracker = ga.getAll()[0];
      if (tracker)
        tracker.send('event', 'tabClick', $('meta[name=id]').attr('content'));
    }
  } catch (e) {

  }
}

const onEvent = is => {
  if (!is) {
    sound.play();
  }
}

channel.on("new_msg", payload => {
  const code = payload.user
  let message = payload.body
  let active = $('.nav-tabs .active').attr('code')

  emitter.emit('isPageActiveEmit')
  emitter.off('isPageActiveOn', onEvent)
  emitter.on('isPageActiveOn', onEvent)

  if (payload.type == 'message') {
    message = xss(message, { stripIgnoreTag: true })

    $('#roomMenu-'+code).attr('sp', 0)

    if (active != code) {
      sound.play();
    } else {
      $(window).scrollTop(0)
    }

    if (!$('#menu-'+code).length) {
      const tabDiv = '<div id="menu-'+code+'" class="tab-pane fade">'+
                      '<ul class="list-group messages-'+code+'">'+
                      // '  <li class="list-group-item userLi">...</li>'+
                      '</ul>'
                      '</div>'

      const tabMenu = '<li code="'+code+'" id="roomMenu-'+code+'" room="1"><a code="'+code+'" data-toggle="tab" href="#menu-'+code+'">'+code+' <span id="notify-'+code+'" style="font-weight:bold">(1)</span> <button id="closeRoom-'+code+'" style="border-radius:50%">x</button></a></li>'

      $('.nav-tabs').append(tabMenu)
      $('.tab-content').append(tabDiv)

      $('#closeRoom-'+code).on('click', e => {
        $('#roomMenu-'+code).remove()
        $('#menu-'+code).remove()
        $('.usersTab').tab('show')
        $('#home').addClass('active in')
        $('#msg').attr('disabled', 'disabled')

        tabWidthUpdate()

        cacheDB.removeRoom(code)
      })

      tabClick()

      cacheDB.createRoom(code)

    } else {
      if (code != active) {
        const text = $('#notify-'+code).text().replace(/[() \+]/g, '')

        let num = parseInt(text.length ? text : 0)

        num = num ? num : 0

        if (num >= 10) {
          $('#notify-'+code).text(num ? ('(10+)') : '')
          ++num
        } else {
          $('#notify-'+code).text('('+(++num)+')')
        }

        cacheDB.setRoomNotify(code, num)
      }
    }

    const me = $('meta[name=id]').attr('content')

    $('.messages-'+code).prepend(`
      <li class="list-group-item" style="background-color:#fff">
        <div class="row" style="padding:4px">
          <div style="float:left;">
            <img code="<%= user.code %>" src="/images/profile.png" class="userPic img-circle" style="width:30px">
          </div>
          <div style="float:left;width:90%">
            <div style="padding:0 4px 4px 4px">
              ${decodeURIComponent(message.autoLink({ target: "_blank", rel: "nofollow" }))}
            </div>
            <div style="font-size:11px" class="time" date="${Date()}">
              ${moment().fromNow()}
            </div>
          </div>
        </div>
      </li>
    `)

    cacheDB.createMessage({
      room: code,
      user: code,
      time: new Date(),
      body: message,
      type: "message"
    })

    tabWidthUpdate()
  }

})

const userLi = e => {
  const code = $(e.target).attr('code')

  if ("ga" in window) {
    var tracker = ga.getAll()[0];
    if (tracker)
      tracker.send('event', 'openUserTab', code);
  }

  if ($('#menu-'+code).length) {
    $('#roomMenu-'+code).tab('show')

    $('#menu-'+code).addClass('active in')
    $('#home').removeClass('active in')
  } else {
    const tabDiv = '<div id="menu-'+code+'" class="tab-pane fade">'+
                    '<ul class="list-group messages-'+code+'">'+
                    // '  <li class="list-group-item userLi">...</li>'+
                    '</ul>'
                    '</div>'

    const tabMenu = '<li code="'+code+'" id="roomMenu-'+code+'" room="1"><a code="'+code+'" data-toggle="tab" href="#menu-'+code+'">'+code+' <span id="notify-'+code+'" style="font-weight:bold"></span> <button id="closeRoom-'+code+'" style="border-radius:50%">x</button></a></li>'

    $('.nav-tabs').append(tabMenu)
    $('.tab-content').append(tabDiv)

    $('#closeRoom-'+code).on('click', e => {
      $('#roomMenu-'+code).remove()
      $('#menu-'+code).remove()
      $('.usersTab').tab('show')
      $('#home').addClass('active in')
      $('#msg').attr('disabled', 'disabled')

      if ("ga" in window) {
        var tracker = ga.getAll()[0];
        if (tracker)
          tracker.send('event', 'closeUserTab', code);
      }

      tabWidthUpdate()

      cacheDB.removeRoom(code)
    })

    $('#roomMenu-'+code).tab('show')
    $('#menu-'+code).addClass('active in')
    $('#home').removeClass('active in')
  }

  tabClick()

  cacheDB.createRoom(code)

  tabWidthUpdate()

  $('#msg').removeAttr('disabled')
  $('#msg').focus()

  if (cacheDB.getRoomInput(code).text.length) {
    $('#msg').val(cacheDB.getRoomInput(code).text)
  } else {
    $('#msg').val($('#roomMenu-'+code).attr('input-text'))
  }

  $('#notify-'+code).text('')

  if (code) {
    $(window).scrollTop(parseInt($('#roomMenu-'+code).attr('sp')) || 0)
  }
}

$('.userLi').on('click', userLi)

$('#msg').on('keyup', e => {
  const code = $('.nav-tabs li.active').attr('id').split('-').pop()
  let message = $(e.target).val()
  const active = $('.nav-tabs .active').attr('code')

  message = xss(message, { stripIgnoreTag: true })

  $('#roomMenu-'+code).attr('input-text', message)

  cacheDB.setRoomInput(code, message);
})

$('#msg').on('keydown', e => {
  const code = $('.nav-tabs li.active').attr('id').split('-').pop()
  let message = $(e.target).val()
  const me = $('meta[name=id]').attr('content')

  message = xss(message, { stripIgnoreTag: true });

  if (e.keyCode == 13 && message.trim().length) {
    $('.messages-'+code).prepend(`
      <li class="list-group-item" style="background-color:#ecf0f1">
        <div class="row" style="padding:4px">
          <div style="float:left;">
            <img code="<%= user.code %>" src="/images/profile.png" class="userPic img-circle" style="width:30px">
          </div>
          <div style="float:left;width:90%">
            <div style="padding:0 4px 4px 4px">
              ${decodeURIComponent(message.autoLink({ target: "_blank", rel: "nofollow" }))}
            </div>
            <div style="font-size:11px" class="time" date="${Date()}">
              ${moment().fromNow()}
            </div>
          </div>
        </div>
      </li>
    `);

    channel.push("new_msg", {id: code, me: $('meta[name=id]').attr('content'), msg: message, type: 'message'});

    cacheDB.createMessage({
      room: code,
      user: $('meta[name=id]').attr('content'),
      time: new Date(),
      body: message,
      type: "message"
    });

    $(e.target).val('');

    $(window).scrollTop(0);
  }
})

$('.shuffle').click(() => {
  $.get('/users', ({users}) => {
    $('.usersUl').html('')

    for (let user of users) {
      $('.usersUl').append(`
        <li class="list-group-item userLi" code="${user.code}" style="cursor:pointer">
          <img code="${user.code}" src="/images/profile.png" class="userPic img-circle" style="width:30px;height:auto"> ${user.code}
        </li>
      `)
    }

    $('.userLi').off('click')

    $('.userLi').on('click', userLi)

    if ("ga" in window) {
      var tracker = ga.getAll()[0];
      if (tracker)
        tracker.send('event', 'shuffleClick', $('meta[name=id]').attr('content'));
    }
  })
});

$(window).scroll(e => {
  const code = $('.nav-tabs .active').attr('code')

  if (code) {
    $('#roomMenu-'+code).attr('sp', $(window).scrollTop())
  }
});

$(document).ready(() => {

  cacheDB.runCache()

  if (USER) {

    const {code} = USER

    if ($('#menu-'+code).length) {
      $('#roomMenu-'+code).tab('show')

      $('#menu-'+code).addClass('active in')
      $('#home').removeClass('active in')
    } else {
      const tabDiv = '<div id="menu-'+code+'" class="tab-pane fade">'+
                      '<ul class="list-group messages-'+code+'">'+
                      // '  <li class="list-group-item userLi">...</li>'+
                      '</ul>'
                      '</div>'

      const tabMenu = '<li code="'+code+'" id="roomMenu-'+code+'" room="1"><a code="'+code+'" data-toggle="tab" href="#menu-'+code+'">'+code+' <span id="notify-'+code+'" style="font-weight:bold"></span> <button id="closeRoom-'+code+'" style="border-radius:50%">x</button></a></li>'

      $('.nav-tabs').append(tabMenu)
      $('.tab-content').append(tabDiv)

      $('#closeRoom-'+code).on('click', e => {
        $('#roomMenu-'+code).remove()
        $('#menu-'+code).remove()
        $('.usersTab').tab('show')
        $('#home').addClass('active in')
        $('#msg').attr('disabled', 'disabled')

        if ("ga" in window) {
          var tracker = ga.getAll()[0];
          if (tracker)
            tracker.send('event', 'closeUserTab', code);
        }

        tabWidthUpdate();

        cacheDB.removeRoom(code);
      })

      $('#roomMenu-'+code).tab('show')
      $('#menu-'+code).addClass('active in')
      $('#home').removeClass('active in')

      cacheDB.createRoom(code)

      tabWidthUpdate();
    }

    new Noty({
      type: 'success',
      text: 'Chat was initiated',
      layout: 'topCenter',
      theme: 'relax',
      animation: {
        open: 'animated fadeIn',
        close: 'animated fadeOut'
      },
      timeout: 500
    }).show();

    $('#msg').removeAttr('disabled');
    $('#msg').focus();

  } else if (!USER && window.location.pathname != '/') {

    new Noty({
      type: 'success',
      text: 'User not found',
      layout: 'topCenter',
      theme: 'relax',
      animation: {
        open: 'animated fadeIn',
        close: 'animated fadeOut'
      },
      timeout: 500
    }).show();

  }

})
