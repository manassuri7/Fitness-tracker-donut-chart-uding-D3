const form=document.querySelector('form');
const name=document.querySelector('#name');
const cost=document.querySelector('#cost');
const error=document.querySelector('#error');

//event listener
form.addEventListener('submit',(e)=>{
    e.preventDefault();
    if(name.value && cost.value){
      const item={
          name:name.value,
          cost:parseInt(cost.value)//to convert to integer
      };
    db.collection('expenses').add(item).then(res=>{
        //reset the values to null again
        error.textContent="";
        name.value="";
        cost.value="";
    })  
    }
    else{
        error.textContent="Please enter value before submitting";
    }
})