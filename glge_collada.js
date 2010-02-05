/*
GLGE WebGL Graphics Engine
Copyright (c) 2010, Paul Brunt
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of GLGE nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL PAUL BRUNT BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

GLGE.Collada=function(){};

GLGE.Collada.prototype.getElementById=function(id){
	var tags=this.getElementsByTagName("*");
	for(var i=0; i<tags.length;i++){
		if(tags[i].getAttribute("id")==id){
			return tags[i];
			break;
		}
	}
}
GLGE.Collada.prototype.parseArray=function(node){
	var child=node.firstChild;
	var prev="";
	var output=[];
	var currentArray;
	while(child){
		currentArray=(prev+child.nodeValue).split(" ");
		child=child.nextSibling;
		if(currentArray[0]=="") currentArray.unshift();
		if(child) prev=currentArray.pop();
		output=output.concat(currentArray);
	}
	return output;
}

GLGE.Collada.prototype.loadDocument=function(url){
	var req = new XMLHttpRequest();
	if(req) {
		req.docurl=url;
		req.docObj=this;
		req.onreadystatechange = function() {
			if(this.readyState  == 4)
			{
				if(this.status  == 200 || this.status==0){
					this.responseXML.getElementById=this.docObj.getElementById;
					this.docObj.loaded(this.docurl,this.responseXML);
				}else{ 
					GLGE.error("Error loading Document: "+this.docurl+" status "+this.status);
				}
			}
		};
		req.open("GET", url, false);
		req.send("");
	}	
}

GLGE.Collada.prototype.getSource=function(id){
	var element=this.xml.getElementById(id);
	var value;
	if(element.tagName=="vertices"){
		value=this.getSource(element.getElementsByTagName("input")[0].getAttribute("source").substr(1));
	}else{
		value=this.parseArray(element.getElementsByTagName("float_array")[0]);
		stride=element.getElementsByTagName("accessor")[0].getAttribute("stride");
		value={array:value,stride:stride};
	}
	return value;
}

GLGE.Collada.prototype.getGeometry=function(id){
	var i,n;
	var mesh;
	var inputs;
	var inputArray;
	var faces;
	var outputData;
	var rootNode=this.xml.getElementById(id);
	var meshNode=rootNode.getElementsByTagName("mesh")[0];
	//create a mesh for each set of faces
	var triangles=meshNode.getElementsByTagName("triangles");
	for(i=0;i<triangles.length;i++){
		//go though the inputs to get the data layout
		inputs=triangles[i].getElementsByTagName("input");
		inputArray=[];
		for(n=0;n<inputs.length;n++){
			inputs[n].data=this.getSource(inputs[n].getAttribute("source").substr(1));
			inputArray[inputs[n].getAttribute("offset")]=inputs[n];
		}
		//get the face data and push the data into the mesh
		faces=this.parseArray(triangles[i].getElementsByTagName("p")[0]);
		outputData={};
		for(j=0;j<faces.length;j=j+inputArray.length){
			for(n=0;n<inputArray.length;n++){
				var block=inputArray[n].getAttribute("semantic");
				if(!outputData[block]) outputData[block]=[];
				for(k=0;k<inputArray[n].data.stride;k++){
					outputData[block].push(inputArray[n].data.array[faces[j+n]+k]);
				}
			}
		}
		//if we have no normal data then use face normals
		if(!outputData.NORMAL){
			outputData.NORMAL=[];
			for(j=0;j<faces.length;j=j+(inputArray.length*3)){
				for(n=0;n<inputArray.length;n++){
					var block=inputArray[n].getAttribute("semantic");
					if(block=="VERTEX"){
						data=inputArray[n].data.array;
						vec1=new GLGE.Vec([data[faces[j+n]],data[faces[j+n]+1],data[faces[j+n]+2]]);
						vec2=new GLGE.Vec(data[faces[j+n+inputArray.length]],data[faces[j+n+inputArray.length]+1],data[faces[j+n+inputArray.length]+2]);
						normal=vec1.cross(vec2).toUnitVector();
						outputData.NORMAL.push(normal.e(1),normal.e(2),normal.e(3));
						outputData.NORMAL.push(normal.e(1),normal.e(2),normal.e(3));
						outputData.NORMAL.push(normal.e(1),normal.e(2),normal.e(3));
					}
				}
			}
		}
		alert(outputData.NORMAL);
	}
};

GLGE.Collada.prototype.loaded=function(url,xml){
	this.xml=xml;
	//alert(this.getSource("geometry0-texcoord"));
	this.getGeometry("geometry0");
}