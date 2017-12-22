			function setup() {
				document.getElementById("categoryButton").addEventListener("click", addCategory, true);
				document.getElementById("purchaseButton").addEventListener("click", addPurchase, true);
				document.getElementById("deleteButton").addEventListener("click", deleteCategory, true);

				initCategory();
				poller();
			}

			function initCategory(){
				var catRow = document.getElementById("rowOfLabels");
				addCell(catRow, "Uncategorized");

				var limitRow = document.getElementById("rowOfLimits");
				addCell(limitRow, "None");

				var spentRow = document.getElementById("rowOfSpending");
				addCell(spentRow, 0);

				var remainingRow = document.getElementById("rowOfRemaining");
				addCell(remainingRow, 0);
			}

			function poller() {
				makeReq("GET", "/cats", 200, catDropdown);
				makeReq("GET", "/purchases", 200, postPurchase);
				makeReq("GET", "/cats", 200, repopulate);
			}

			function makeReq(method, target, retCode, action, data) {
				var httpRequest = new XMLHttpRequest();

				if (!httpRequest) {
					alert('Giving up :( Cannot create an XMLHTTP instance');
					return false;
				}

				httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
				httpRequest.open(method, target);
				
				if (data){
					httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
					httpRequest.send(data);
				}
				else {
					httpRequest.send();
				}
			}

			function makeHandler(httpRequest, retCode, action) {
				function handler() {
					if (httpRequest.readyState === XMLHttpRequest.DONE) {
						if (httpRequest.status === retCode) {
							console.log("recieved response text:  " + httpRequest.responseText);
							action(JSON.parse(httpRequest.responseText));
						} else {
							alert("There was a problem with the request.  you'll need to refresh the page!");
						}
					}
				}
				return handler;
			}


			function addCategory(){
				var newCat = document.getElementById("categoryName").value;
				var categoryValue = document.getElementById("categoryValue").value;
				var data;
				data = "categoryName=" + newCat + "&categoryValue=" + categoryValue;
				makeReq("POST", "/cats", 201, postCategory(newCat, categoryValue), data);

				document.getElementById("categoryForm").reset();
				makeReq("GET", "/cats", 200, catDropdown);
			}

			function catDropdown(responseText){
				var drop = document.getElementById("categoryDropdown");
				var deleteDrop = document.getElementById("deleteDrop");

				while (drop.firstChild){
					drop.removeChild(drop.firstChild);
					deleteDrop.removeChild(deleteDrop.firstChild);
				}

				var length = responseText.length;

				for (var i = 0; i < length; i++)
				{
					var catOption = document.createElement('OPTION');
					var delOption = document.createElement('OPTION');

					catOption.text = responseText[i].category;
					catOption.value = responseText[i].category;

					delOption.text = responseText[i].category;
					delOption.value = responseText[i].category;

					drop.appendChild(catOption);
					deleteDrop.appendChild(delOption);
				}
			}

			function postCategory(newCat, categoryValue){
				var catRow = document.getElementById("rowOfLabels");
				addCell(catRow, newCat);

				var limitRow = document.getElementById("rowOfLimits");
				addCell(limitRow, categoryValue);

				var spentRow = document.getElementById("rowOfSpending");
				addCell(spentRow, 0);

				var remainingRow = document.getElementById("rowOfRemaining");
				addCell(remainingRow, categoryValue);
			}

			function addCell(row, text)
			{
				var newCell = row.insertCell();
				var newText = document.createTextNode(text);
				newCell.appendChild(newText);
			}

			function addPurchase()
			{
				var purchaseCat = document.getElementById("categoryDropdown").value;
				var purchaseDate = document.getElementById("purchaseDate").value;
				var purchaseName = document.getElementById("purchaseName").value;
				var purchaseSpent = document.getElementById("amountSpent").value;

				var data;
				data = "categoryName=" + purchaseCat + "&purchaseDate=" + purchaseDate + "&purchaseName=" + purchaseName + "&amountSpent=" + purchaseSpent;

				makeReq("POST", "/purchases", 201, postPurchase, data);

				document.getElementById("purchaseForm").reset();
			}

			function deleteCategory() {
				var deleteCat = document.getElementById("deleteDrop").value;
				var data = "categoryName=" + deleteCat;
				makeReq("DELETE", "/cats", 200, categoryDropdown, data);

				var table = document.getElementById("theTable");
				for (var i = 2; i < table.rows[0].cells.length; i++)
				{
					if (table.rows[0].cells[i].innerText === deleteCat)
					{
						table.rows[0].deleteCell(i);
						table.rows[1].deleteCell(i);
						table.rows[2].deleteCell(i);
						table.rows[3].deleteCell(i);
					}
				}

				makeReq("GET", "/purchases", 200, postPurchase);
			}

			function postPurchase(responseText){
				console.log(responseText)
				var table = document.getElementById("theTable");
				var cats = ["Uncategorized"];

				for (var i = 1; i < table.rows[0].cells.length; i++)
				{
					cats.push(table.rows[0].cells[i].innerText);
					current = responseText.filter( function(purchaseName)
					{
						if (purchaseName.category === table.rows[0].cells[i].innerText)
						{
							return true;
						}
						return false;
					});
					sum = {amountPaid: 0}
					if (current.length > 0)
					{
						sum = current.reduce(function(purchase1, purchase2){
							return {amountPaid: parseFloat(purchase1.amountPaid) + parseFloat(purchase2.amountPaid)}
						});
					}
					table.rows[2].cells[i].innerText = sum.amountPaid;
					limit = parseFloat(table.rows[1].cells[i].innerText);
					if(!isNaN(limit))
					{
						var diff = limit - sum.amountPaid;
						table.rows[3].cells[i].innerText = diff;
					}
				}

				var uncategorized = responseText.filter( function(purchaseName)
				{
					return !(cats.includes(purchaseName.category));
				});
				sum = {amountPaid:0}
				if(uncategorized.length > 0)
				{
					sum = uncategorized.reduce(function(purchase1, purchase2){
						return {amountPaid: parseFloat(purchase1.amountPaid) + parseFloat(purchase2.amountPaid)}
					});
				}
				table.rows[2].cells[1].innerText = parseFloat(table.rows[2].cells[1].innerText) + sum.amountPaid;
			}


			function repopulate(responseText) {
				console.log("repopulating!");
				var table = document.getElementById("theTable");
				var length = responseText.length;
				for(var i = 1; i < length; i++)
				{
					var categoryRow = document.getElementById("rowOfLabels");
					addCell(categoryRow, responseText[i].category);
		
					var limitRow = document.getElementById("rowOfLimits");
					addCell(limitRow, responseText[i].limit);
					
					var spentRow = document.getElementById("rowOfSpending");
					addCell(spentRow, 0);
					
					var remainingRow = document.getElementById("rowOfRemaining");
					addCell(remainingRow, responseText[i].limit);
				}

			}

			// setup load event
			window.addEventListener("load", setup, true);