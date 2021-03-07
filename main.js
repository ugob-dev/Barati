const cluster = require('cluster')
const { Worker,workerData } = require('worker_threads')

const args = process.argv.slice(2);

const multiplier = args[0];
const cooksPerKitchen = args[1];
const time = args[2];

// console.log('Multiplier for the cooking time of the dish : ' + multiplier);
// console.log('Number of cooks per kitchen : ' + cooksPerKitchen);
// console.log('Time in milliseconds, used by the kitchen stock to replace ingredients : ' + time);

const cuisinierMax =2
let AllCuisine = 0
let cuisinier =0    
let AllDish = []

//forma takoyomi cooks taille 

const processesMap = {
    
}

function takeDish(){
    
    let Ldish = []
    for(let i=0; i< args.length/3 ;i++){
        const multiplier = args[0 + (i*3)];
        const cooksPerKitchen = args[1+ (i*3)];
        const time = args[2+ (i*3)];
        Ldish[i]= multiplier+' '+ cooksPerKitchen +' '+  time
    }

    return Ldish
    // let AllDish =args.split(',')
    // const words = str.split(' ');
}
function main(){


    
    // console.log('ugo  ' +args)

    if (cluster.isMaster) 
    {
        
      AllDish=  takeDish()
    //   console.log(AllDish)
      const processesMap = {}
      i =0  
      z=0
      sendKitchen(AllDish,i,z)
    }else{
            //CUISINE
             
        let kill =0
        console.log(`[${process.env.kitchenId}] Creation`)
        setInterval(() => {
          let cuisinierDispo = cuisinierMax-cuisinier
          if(cuisinierDispo ==0){
              process.send({ status: 'OVERLOAD',KitchenId:process.env.kitchenId })
          }else{                
              process.send({ status: 'DISPO',KitchenId:process.env.kitchenId })
          }
          
          if(cuisinier ==0){
            kill ++
          }else{
            kill=0
          }
          if(kill == 3){ //cuisine inactif depuis 6second
            
            console.log(`[${process.env.kitchenId}] Destruction de cuisine`)
            process.kill(process.pid)
          } 
        }, 2000)
        
        process.on('message', (payload) => {
            if(payload.KitchenId ==process.env.kitchenId ){

                if( payload.dish !='Created'){
                    cuisinier = cuisinier+1
                    let dish = payload.dish
                    _useWorker('./cuisinier.js',dish,process.env.kitchenId)
                }
            }
        })
    }
}

function sendKitchen(Alldish,i,z){
        
        let myId = (i + 1).toString().padStart(2, '0')
        let kitchen = cluster.fork({ kitchenId: myId })
        processesMap[kitchen.id] = myId
        kitchen.on('message', (payload) => {
            
        if(z<Alldish.length){      
            if (payload.status === 'OVERLOAD') {
                if(((AllCuisine + 1).toString().padStart(2, '0')) == payload.KitchenId){ // ne creer pas de cuisine si le dernier overload n'est pas de la dernier cuisine
                    i++
                    AllCuisine++
                    sendKitchen(Alldish,i,z) // creer une autre cuisine et rappel la function (pour avoir le on sur cette kitchen)
                }
            }
            if (payload.status === 'DISPO') {
                // console.log(payload.KitchenId+'----------'+AllDish[z])
                kitchen.send({dish:AllDish[z],KitchenId : payload.KitchenId})
                // console.log(AllDish)
                AllDish.shift()
                
            }
            
        }
        })
    // }
}

function cookMultiplier(dish){
    /*
    Takoyaki: Contains octopus and soja sauce. Baked in 1 sec * multiplier.
    Katsudon: Contains rice, pork, eggs .Bakedin 2 secs * multiplier.
    Udon: Contains noodle, pork, eggs. Bakedin 2 secs * multiplier.
    Ramen: Contains noodle, chicken, eggs. Bakedin 2 secs * multiplier.
    MatchaCookie: Contains dough, matcha, chocolate and chief love. Baked in 4 secs * multiplier.
    */
    const plat = dish.split(' ')[0]
    const cooker =  dish.split(' ')[1]
    switch(plat){
        case 'Takoyaki':
            return cooker * 1 * 1000 // return la cuisson en ms
            break;
        
        case 'Katsudon':
            return cooker *2* 1000 // return la cuisson en ms
            break;        
        case 'Udon':
            return cooker *2 * 1000 // return la cuisson en ms
            break;
        
        case 'Ramen':
            return cooker *2* 1000 // return la cuisson en ms
            break;
        
        case 'MatchaCookie':
            return cooker *4* 1000 // return la cuisson en ms
            break;      
    }
    return 0
}
function _useWorker (filepath,dish,kitchenId) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(filepath,{ workerData: {  cooking:cookMultiplier(dish)}}) // creer le thread
      worker.on('online', () => { console.log('['+kitchenId+']je prepare le :' + dish ) }) // quand le thread est bon envoyer un msg
      worker.on('message', payload => { //quand le plat est pres ( msg ) return true
        console.log('['+kitchenId+']le plat :'+ dish + ' est fait')
        cuisinier --
        return resolve
      })
      // verif en cas de plantage
      worker.on('error', reject)
      worker.on('exit', code => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`))
        }
      })
    })
  }
main()
