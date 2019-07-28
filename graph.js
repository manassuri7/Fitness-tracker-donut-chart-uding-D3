const dims={height:300,width:300,radius:150};
const cent={x:(dims.width/2+5),y:(dims.height/2+5)};// 300/2+5=155px

const svg=d3.select('.canvas')
      .append('svg')
      .attr('width',dims.width+150)//for legend
      .attr('height',dims.height+150)

const graph=svg.append('g')
      .attr('transform',`translate(${cent.x},${cent.y})`);
//pie generator for generating slices/angles in raidans in chart 


const pie=d3.pie()
     .sort(null)
     .value(d=>d.cost);//determines the wt of each value and allocates width accordingly

/* start angle and end angle is required by arc generator for creating slices      */

/* const angles=pie([
    {name:'rent','cost':200},
    {name:'bills','cost':300},
    {name:'gaming','cost':690}
     ]); */

//arc generator
const arcPath=d3.arc() 
    .outerRadius(dims.radius)
    .innerRadius(dims.radius/2);//for donut chart 
    
//ordinal scales for alloting diff colours to diff sections
const colour=d3.scaleOrdinal(d3['schemeSet3']) 

//legend setup
const legendGroup=svg.append('g')
      .attr('transform',`translate(${dims.width +40},10)`);

const legend=d3.legendColor()
      .shape('circle')
      .shapePadding('10')
      .scale(colour);  
      
//tooltip setup
const tip=d3.tip()
     .attr('class','tip card')
     .html(d=>{
         let content=`<div class="name">${d.data.name}</div>`;
         content+=`<div class="cost">${d.data.cost}</div>`;
         content+=`<div class="delete">Click to Delete</div>`;
         return content;

     }); 
//calling tip     
 graph.call(tip);    

//update function
const update=(data)=>{
    //console.log(data);

    //update colour scale domain
    colour.domain(data.map(d=>d.name));

//update and call legend
    legendGroup.call(legend)
    legendGroup.selectAll('text')
                .attr('fill','white');   

//join enhanced pie data to path elements
    const paths=graph.selectAll('path')
           .data(pie(data));
   //console.log(paths.enter());

//handle the exit soln for removing elements from DOM
    paths.exit()
          .transition().duration(750)
          .attrTween('d',arcTweenExit)
        .remove();
    
//handle the current DOM path updates
    paths.attr('d',arcPath)//to redraw the path in case of deletion of an element
         .transition().duration(750)
         .attrTween('d',arcTweenUpdate);

    paths.enter()
         .append('path') 
         .attr('class','arc')
         .attr('d',arcPath)
         .attr('stroke','#ffff')
         .attr('stroke-width',3) 
         .attr('fill',d=>colour(d.data.name))
         .each(function(d){this._current=d})//for updating tween
         .transition().duration(750)
            .attrTween('d',arcTweenEnter);    
            
//add events
     graph.selectAll('path')
            //.on('mouseout',handleMouseOver)
           .on('mouseover',(d,i,n)=>{
               tip.show(d,n[i])//current element we r hovering over, shows tip and hover
               handleMouseOver(d,i,n);
           })    
           //.on('mouseout',handleMouseOut)
           .on('mouseout',(d,i,n)=>{
               tip.hide();
               handleMouseOut(d,i,n);
           })

           .on('click',handleClick);        
};     

//data array and firestore
var data=[] ;   

//real time data using event listener
db.collection('expenses').onSnapshot(res=>{
    res.docChanges().forEach(change=>{
        const doc={...change.doc.data(),id:change.doc.id};
    
        switch (change.type){
            case 'added':
                data.push(doc);
                break;
            case 'modified':
                const index=data.findIndex(item=>item.id==doc.id);
                data[index]=doc;
                break;
            case 'removed':  
                data=data.filter(item=>item.id!==doc.id);
                break;  
             default:
             break;     
        }

    });
    update(data);
})    

//tween animation

//enter tween
const arcTweenEnter=(d)=>{
    var i=d3.interpolate(d.endAngle,d.startAngle);

    return function(t){
        d.startAngle=i(t);
  //everytime a ticker changes we r getting new arcpath      
        return arcPath(d);
    }
}
//exit tween
const arcTweenExit=(d)=>{
    var i=d3.interpolate(d.startAngle,d.endAngle);

    return function(t){
        d.startAngle=i(t);
  //everytime a ticker changes we r getting new arcpath      
        return arcPath(d);
    }
}

//tween update
function arcTweenUpdate(d){
  //interpolate between the two obj
  var i=d3.interpolate(this._current,d);

  //update the current prop with new updated data
  this._current=i(1);

  return function(t){
      return arcPath(i(t));
  }
}

//event handler  i is the index of current element and n is the selection of element
const handleMouseOver=(d,i,n)=>{
    console.log(n[i]);
    d3.select(n[i])
       .transition('changeSliceFill').duration(300)
       .attr('fill','#fff');
       //we named it to changeSliceFill so tht it doesnt interact with other transitions
}
//to get back the colour after removig mouse
const handleMouseOut=(d,i,n)=>{
    
    d3.select(n[i])
       .transition('changeSliceFill').duration(300)
       .attr('fill',colour(d.data.name));
}

//click handler to delete a slice document
const handleClick=(d)=>{
    const id=d.data.id;
    db.collection('expenses').doc(id).delete();
}