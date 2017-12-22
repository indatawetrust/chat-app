import "autolink-js"
const localStorageDB = require('localstoragedb');
const lib = new localStorageDB("database", localStorage);

if (!lib.tableExists('rooms')) {
  lib.createTable("rooms", ["code"]);
  lib.createTable("roomInput", ["code", "text"]);
  lib.createTable("roomNotify", ["code", "num"]);
  lib.createTable("messages", ["room", "user", "type", "body", "time"]);
}

const tabClick = () => {
  $('.nav-tabs a').off('click')

  $('.nav-tabs a').on('click', function(event){
    if ($(event.target).parent().attr('room')) {
      $('#msg').removeAttr('disabled')

      const code = $(event.target).attr('code')

      $('#notify-'+code).text('')

      if (fn.getRoomInput(code).text.length) {
        $('#msg').val(fn.getRoomInput(code).text)
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

      fn.setRoomNotify(code, 0)
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

const tabWidthUpdate = () => {
  let total = 0

  $('.userTabs li').each((i, el) => total+=$(el).width())

  total += 60

  $('.userTabs').css({
    width: total+'px'
  })
}

const fn = {
  createRoom: code => {
    if (!lib.queryAll("rooms", {query: {code: code}}).length) {
      lib.insert("rooms", { code });
      lib.commit();
    }
  },
  setRoomInput: (code, text) => {
    lib.insertOrUpdate("roomInput", { code }, { code, text });
    lib.commit();
  },
  getRoomInput: code => {
    return lib.queryAll("roomInput", {query: {code: code}})[0] || {text: ''}
  },
  setRoomNotify: (code, num) => {
    lib.insertOrUpdate("roomNotify", { code }, { code, num });
    lib.commit();
  },
  getRoomNotify: code => {
    return lib.queryAll("roomNotify", {query: {code: code}})[0] || {num: 0}
  },
  removeRoom: code => {
    if (lib.queryAll("rooms", {query: {code: code}}).length) {
      lib.deleteRows("rooms", { code });
      lib.deleteRows("messages", { room: code });
      lib.commit();
    }
  },
  createMessage: message => {
    lib.insert("messages", message);
    lib.commit();
  },
  deleteMessage: messageId => {

  },
  getMessages: code => {
    const messages = lib.queryAll("messages", {query: {room: code},sort: [["time", "DESC"]]})

    return messages
  },
  runCache: () => {
    const rooms = lib.queryAll("rooms")

    for (let { code } of rooms) {
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

        tabWidthUpdate()

        fn.removeRoom(code)
      })

      const me = $('meta[name=id]').attr('content')

      const {num} = fn.getRoomNotify(code)

      if (num > 10) {
        $('#notify-'+code).text(num ? ('(10+)') : '')
      } else {
        $('#notify-'+code).text(num ? ('('+num+')') : '')
      }

      for (let message of fn.getMessages(code)) {
        $('.messages-'+code).append(`
          <li class="list-group-item" style="background-color:#${ message.user == me ? 'ecf0f1' : 'fff' }">
            <div class="row" style="padding:4px">
              <div style="float:left;">
                <img code="<%= user.code %>" src="https://www.ocf.berkeley.edu/~dblab/blog/wp-content/uploads/2012/01/icon-profile.png" class="userPic img-circle" style="width:30px">
              </div>
              <div style="float:left;width:90%">
                <div style="padding:0 4px 4px 4px">
                  ${decodeURIComponent(message.body.autoLink({ target: "_blank", rel: "nofollow" }))}
                </div>
                <div style="font-size:11px" class="time" date="${message.time}">
                  ${moment(message.time).fromNow()}
                </div>
              </div>
            </div>
          </li>
        `)
      }
    }

    tabWidthUpdate()
    tabClick()
  }
}

module.exports = fn;
