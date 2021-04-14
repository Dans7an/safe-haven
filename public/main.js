var thumbUp = document.getElementsByClassName("fa-thumbs-up");
var trash = document.getElementsByClassName("fa-trash");
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


Array.from(thumbUp).forEach(function(element) {
      element.addEventListener('click', function(){
        const name = this.parentNode.parentNode.childNodes[1].innerText
        const msg = this.parentNode.parentNode.childNodes[3].innerText
        const house_id = this.parentNode.parentNode.getAttribute('data-id')
        const thumbUp = parseFloat(this.parentNode.parentNode.childNodes[5].innerText)
        fetch('messages', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            'name': name,
            'msg': msg,
            'id': house_id,
            'thumbUp':thumbUp
          })
        })
        .then(response => {
          if (response.ok) return response.json()
        })
        .then(data => {
          console.log(data)
          // window.location.reload(true)
        })
      });
});

Array.from(trash).forEach(function(element) {
      element.addEventListener('click', function(){
        const name = this.parentNode.parentNode.childNodes[1].innerText
        const msg = this.parentNode.parentNode.childNodes[3].innerText
        const house_id = this.parentNode.parentNode.getAttribute('data-id')
                console.log(house_id);
        fetch('messages', {
          method: 'delete',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'name': name,
            'msg': msg,
            'id': house_id
          })
        }).then(function (response) {
          window.location.reload()
        })
      });
});
