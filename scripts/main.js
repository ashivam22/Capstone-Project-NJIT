let rules =[];
let editedRule={};
let app = null;
let getIP=()=>{};
let getPort = ()=>{};
window.onload = () => {

    const serverData = document.getElementById('server-data');
    const $send = document.getElementById('send');
    const $rules = document.getElementById('rules');


    const $elems = document.querySelectorAll('.modal');
    let modals = M.Modal.init($elems, {});

      fetch('./data/config.json').then(data=> data.json()).then((data) => {


      document.getElementById('send').addEventListener('click',()=>{




      let ip = getIP().replace(/\s/g,'');

      let port = getPort();
        fetch(`${data.server}:${data.port}`,{body: JSON.stringify({rules, ip,port


        }), method: 'POST'}).then(data=> data.json()).then(data => console.log(data));
      },false);


    });




    fetch('data/data.json').then(data => data.json()).then(data => {


        Vue.component('server', {
            props: ['server', 'port'],
            methods: {
              getIP: function() {
                  return `${document.querySelector('#server-data > input:nth-child(2)').value}.
                ${document.querySelector('#server-data > input:nth-child(4)').value}.
                ${document.querySelector('#server-data > input:nth-child(6)').value}.
              ${document.querySelector('#server-data > input:nth-child(8)').value}`;

            },

            getPort: function(){
              return document.querySelector('#server-data > input:nth-child(10)').value;
            }

            },
            mounted: function(){

              getIP = this.getIP;
              getPort = this.getPort;
            },
            template: `
            <div class="card blue-grey darken-1">
              <div class="card-content white-text">
                <span class="card-title">Server ip:port</span>
                <div id="server-data">
                <p></p>
                <input required pattern="^([0-9]{1,3}){3}[0-9]{1,3}$">  <i class="material-icons">fiber_manual_record </i>
                <input required pattern="^([0-9]{1,3}){3}[0-9]{1,3}$">  <i class="material-icons">fiber_manual_record</i>
                <input required pattern="^([0-9]{1,3}){3}[0-9]{1,3}$">  <i class="material-icons">fiber_manual_record</i>
                <input required pattern="^([0-9]{1,3}){3}[0-9]{1,3}$"><a class="dots">:</a><input pattern="^[0-9]{0,3}$" />
                <p></p>
              </div>
            </div>`
        });




        Vue.component('rule',{props:['contains','starts_with','ends_with',
        'doesn_t_contain', 'doesn_t_start_with', 'doesn_t_end_with','Fuzzy','index'],
        template: `
        <div class="row">
        <div class="input-field col s6">
          <div class="collection">
            <a href="#!" class="collection-item">Contains:{{contains}}</a>
            <a href="#!" class="collection-item">Starts with:{{starts_with}}</a>
            <a href="#!" class="collection-item">Ends with:{{ends_with}}</a>
            <a href="#!" class="collection-item">Does not contain: {{doesn_t_contain}}</a>
            <a href="#!" class="collection-item">Does not start with: {{doesn_t_start_with}}</a>
            <a href="#!" class="collection-item">Does not end with {{doesn_t_end_with}}</a>
            <a href="#!" class="collection-item">Fuzzy {{Fuzzy}}</a>
          </div>
        </div>
        <div class="input-field col s6" v-bind:x-data-index="index">
          <a class="waves-effect waves-light btn" id="remove-btn" v-on:click="remove($event)"><i class="material-icons left">remove</i>remove</a>
          <a class="waves-effect waves-light btn" id="edit-btn" v-on:click="edit($event)"><i class="material-icons left">edit</i>edit</a>
        </div>
      </div>`, data: {
          currentRule:{}
        },
        methods: {
          remove: function($event) {

//            let index = d
        this.$emit('remove', $event.target.parentElement.getAttribute('x-data-index'));
          },
          edit: function($event) {

            this.$emit('edit', {
            index: $event.target.parentElement.getAttribute('x-data-index'),
            contains: this.contains,
            starts_with: this.starts_with,
            ends_with: this.ends_with,
            doesn_t_contain: this.doesn_t_contain,
            doesn_t_start_with: this.doesn_t_start_with,
            doesn_t_end_with: this.doesn_t_end_with,
            Fuzzy: this.Fuzzy
          });

          }
        }
        });





        app = new Vue({
            el: '#app',
            data: {
                server: data.server,
                port: data.port,
                rules,
                data: {
                    currentRule:{}
                  }
            },
            methods:{

              accept: function(){
                    let $addRule =document.getElementById('add-rule');
                    let $ruleValue =document.getElementById('rule-value');

                for(let i=0, max=$addRule.children.length; i<max;i++) {
                  if($addRule.children[i].innerHTML.match(document.getElementById('change-param').value)) {
                      $addRule.children[i].innerHTML=document.getElementById('change-param').value+':    '+$ruleValue.value;
                  }
                }
              },
              onRemove(value){

                let tail = this.rules.splice(parseInt(value));
                tail.shift();
                this.rules = this.rules.concat(tail);
                rules = this.rules;
              },

              onEdit(value){
                console.log('value');
                console.log(value);
                localStorage.setItem('index',value.index);
                let $addRule =document.getElementById('add-rule');
                $addRule.children[0].innerHTML+=': '+value['contains'];
                $addRule.children[1].innerHTML+=': '+value['starts_with'];
                $addRule.children[2].innerHTML+=': '+value['ends_with'];
                $addRule.children[3].innerHTML+=': '+value['doesn_t_contain'];
                $addRule.children[4].innerHTML+=': '+value['doesn_start_with'];
                $addRule.children[5].innerHTML+=': '+value['doesn_ends_with'];
                $addRule.children[6].innerHTML+=': '+value['Fuzzy'];
              },

              add() {
                    let $addRule =document.getElementById('add-rule');
                    editedRule={};
                    let line = null;

                    for(let i=0, max=$addRule.children.length; i<max;i++) {

                      line = $addRule.children[i].innerHTML.split(':');
                      editedRule[line[0].replace(/\s/g,'_').replace('’','_')]=typeof line[1]==='undefined'?'':line[1].trim();
                      $addRule.children[i].innerHTML=line[0]+':';

                    }

                    this.rules.push(editedRule);
                    clearRule($addRule);


                    if(localStorage.getItem('index')) {
                      this.rules = this.rules.map((item,index)=>{
                              if(index===parseInt(localStorage.getItem('index'))){
                                localStorage.removeItem('index');
                                return editedRule;
                              } else {
                                return item;
                              }
                      });

                    }

              }
            }


        }).$mount("#app");

        var elems = document.querySelectorAll('select');
        var instances = M.FormSelect.init(elems, {});


    });


}


function clearRule($addRule){
  $addRule.children[0].innerHTML=$addRule.children[0].innerHTML.split(':')[0];//': '+value['contains'];
  $addRule.children[1].innerHTML=$addRule.children[1].innerHTML.split(':')[0];//': '+value['starts_with'];
  $addRule.children[2].innerHTML=$addRule.children[2].innerHTML.split(':')[0];//': '+value['ends_with'];
  $addRule.children[3].innerHTML=$addRule.children[3].innerHTML.split(':')[0];//': '+value['doesn_t_contain'];
  $addRule.children[4].innerHTML=$addRule.children[4].innerHTML.split(':')[0];//': '+value['doesn_start_with'];
  $addRule.children[5].innerHTML=$addRule.children[5].innerHTML.split(':')[0];//': '+value['doesn_ends_with'];
  $addRule.children[6].innerHTML=$addRule.children[6].innerHTML.split(':')[0];//': '+value['Fuzzy'];
}
