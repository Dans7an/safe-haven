var accepted = document.getElementsByClassName("Accept");
var declined = document.getElementsByClassName("Decline");
var trash = document.getElementsByClassName("fa-trash");
var trash2 = document.getElementsByClassName("same");
var fullView = document.getElementsByClassName("houses");

//Responsible for the post request to the routes.js

// var wrapper = document.querySelector('#wrapper')
// wrapper.addEventListener('submit', submit)
//
// function submit(e){
//   e.preventDefault()
//   console.log(e.target);
//   if(e.target.tagName === 'FORM'){
//     const formInfo = e.target
//     const form = new FormData()
//     const data = {
//       name: formInfo.querySelector('.name').value,
//       msg: formInfo.querySelector('.msg').value,
//       "file-to-upload": formInfo.querySelector('.logo').files[0]
//     }
//     console.log(e.target);
//
//     for(let i in data){
//       form.set(i, data[i])
//     }
//     fetch('messages', {
//       method: 'post',
//       body: form
//     }).then (() => {
//       window.location.reload(true)
//     })
//   }
// }

Array.from(fullView).forEach(function(element) {
  element.addEventListener('click', function(){
    console.log(this.parentNode.parentNode.getAttribute('data-id'));
    const house_id = this.parentNode.parentNode.getAttribute('data-id')

    window.location.href = '/fullView?house_id=' + house_id
  })
})

Array.from(accepted).forEach(function(element) {
      element.addEventListener('click', function(){
        const requestId = this.parentNode.parentNode.getAttribute('data-requestId')
        console.log(this.parentNode.childNodes[1]);
        fetch('accepted', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            'requestId': requestId
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});

Array.from(declined).forEach(function(element) {
      element.addEventListener('click', function(){
        const requestId = this.parentNode.parentNode.getAttribute('data-requestId')
        fetch('declined', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            'requestId': requestId
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          window.location.reload(true)
        })
      });
});

Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        const requestId = this.parentNode.parentNode.getAttribute('data-id')
        console.log(requestId);
        fetch('requests', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'requestId': requestId
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});

Array.from(trash2).forEach(function(element) {
      element.addEventListener('click', function(){
        const requestId = this.parentNode.parentNode.getAttribute('data-id')
        console.log(requestId);
        fetch('messages', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'id': requestId
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});
