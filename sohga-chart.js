$(function(){
	$.fn.sgChart = function(monday, options){
		var defaults = {
				isKanrisha: false,
				timeUnit: 'week',
                chartHeight: 700,
                xLabelHeight: 30,
                ymax: 150,
                tickStep: 25,
                weekDay: ['（月）','（火）','（水）','（木）','（金）','（土）','（日）'],
                colors: ['#de9610','#c93a40','#fff001','#d06d8c','#65ace4','#a0c238','#56a764','#d16b16','#cc528b','#9460a0','#f2cf01','#0074bf','#c2007b','#c60019','#1d4293','#00984b','#019fe6','#d16b16','#9bcad0'],
                divForDrag: $('.divForDrag'),
            };
		var options = $.extend(defaults, options);
		var chart = this;
		var orders = [];
		var ordersInput = null;
		var mondayFormat = null;
		var dragFlag = false;
		var dragChart = false;
		var dragItem = false;
		var dropChart = false;
		var dblClickTarget = false;
		var offsetLeft = 0;
		var offsetTop = 0;
		var colorIndex = [];
		var xxx = false;
		var processOrders = [[50,'グーグル',0,0,600]];
		var processOrdersInput = processOrders.slice();

		ajaxAndDraw(monday);
		
		chart.on('mouseover', '.order', function(){$(this).addClass('opacity80');});
		chart.on('mouseout', '.order', function(){$(this).removeClass('opacity80');});
		chart.on('mouseover', '.chart-column, .process-orders-chart', function(){if (dragFlag) dropChart = $(this); });
		chart.on('mouseout', '.chart-column, .process-orders-chart', function(){ dropChart = false;});

		chart.on('click', '.prev-week, .next-week', function(){
			if ($(this).hasClass('prev-week')) monday.setDate(monday.getDate() - 7);
			else monday.setDate(monday.getDate() + 7);
			orders[mondayFormat] = ordersInput;
			ajaxAndDraw(monday);
		});
		chart.on('mousedown', '.process-order, .order', function(e){
			if (options.isKanrisha || $(this).hasClass('process-order')){
				dragItem = $(this);
				dragFlag = true;
				dragChart = dragItem.parent();
				options.divForDrag.html(dragItem.html()).attr('style', dragItem.attr('style')).width($(this).width());
				var offset = dragItem.offset();	
				offsetLeft = e.pageX - offset.left;
				offsetTop = e.pageY - offset.top;
			}
		});
		chart.on('mousemove', function(e){
			if (dragItem){
				dragItem.addClass('hide');
				options.divForDrag.removeClass('hide');
				options.divForDrag.offset({ left: e.pageX - offsetLeft, top: e.pageY - offsetTop });
			}
		})
		$(window).on('mouseup', function(){
			if (dragFlag && dropChart){
				dropOrder();
			} else if(dragFlag){
				resetDrop();
			}
		});

		chart.on('dblclick', '.process-order', function(){
			dblClickTarget = $(this);
			$('#sohga-chart-split-process-order').modal('toggle');
		});
		chart.parent().on('click', '#sohga-chart-split-process-order .split', function(){
			var partsNumber = $(this).parent().find('input').val();
			$(this).parent().next().empty();
			for (var i = 1; i <=partsNumber; i++) {
				$(this).parent().next().append("<div>Part " + i + ": <input type='text' value='0'></div>");
			}
			var firstInput = $(this).parent().next().find('div:first-child input');
			sum = processOrdersInput[dblClickTarget.index()][4];
			firstInput.val(sum);
		});
		chart.parent().on('click', '#sohga-chart-split-process-order .agree', function(){
			$('#sohga-chart-split-process-order').modal('toggle');
			var values = $("#sohga-chart-split-process-order .append input").map(function(){return $(this).val();}).get();
			splitProcessOrder(values);
		});


		function ajaxAndDraw(day){
			setMonday(day);
			if (mondayFormat in orders){
				ordersInput = orders[mondayFormat].slice();
				draw();
			} else{
				$.ajax({
					type: "POST",
					dataType: "JSON",
					url: '/sales/business/get_orders',
					data: {monday:monday, timeUnit:timeUnit},
					success: function( response ) {
						if (response.success_flg){
							orders[mondayFormat] = response.message;
							ordersInput = orders[mondayFormat].slice();
							draw();
						}
					}
				});
			}
		}

		function draw(){
			chart.empty();
			chart.append("<i class='prev-week material-icons md-dark pmd-md' style='top:"+(options.chartHeight/2)+"px'>navigate_before</i><i class='next-week material-icons md-dark pmd-md' style='top:"+(options.chartHeight/2)+"px'>navigate_next</i>");
			chart.append("<div class='orders-chart' style='height:"+options.chartHeight+"px'><div class='y-label'></div><div class='chart' style='height:"+(options.chartHeight - options.xLabelHeight)+"px'></div><div class='x-label' style='height:"+options.xLabelHeight+"px;line-height:"+options.xLabelHeight+"px'></div></div><div class='process-orders-chart' style='height:"+(options.chartHeight - options.xLabelHeight)+"px'></div>");
			chart.parent().append("<div tabindex='-1' class='modal fade' id='sohga-chart-split-process-order' style='display: none;' aria-hidden='true'><div class='modal-dialog'><div class='modal-content'><div class='modal-header'><h2 class='pmd-card-title-text'>新しい受注分割</h2></div><div class='modal-body'><div><div>いくつ：</div><input type='text' value='0'><button class='btn btn-primary split'>OK</button></div><p class='append'></p></div><div class='pmd-modal-action pmd-modal-bordered text-right'><button data-dismiss='modal' class='btn pmd-btn-flat pmd-ripple-effect btn-primary' type='button'>Disagree</button><button type='button' class='btn pmd-btn-flat pmd-ripple-effect btn-default agree'>Agree</button></div></div></div></div>");
			chart.find('.y-label').append("<div class='tick' style='height:"+options.xLabelHeight+"px'>0</div");
			var count = options.ymax/options.tickStep;
			var tempDate = new Date(monday);
			for (var i = options.tickStep; i <= options.ymax; i+=options.tickStep) {
				chart.find('.y-label').append("<div class='tick' style='height:"+((options.chartHeight - options.xLabelHeight)/count)+"px'>"+ i +"</div");
			}
			if (options.timeUnit == 'week'){
				for (i=0; i <= 7; i++) {
					chart.find('.chart').append("<div class='chart-column'></div>");
					chart.find('.x-label').append("<div class='ticks'>"+ (tempDate.getMonth()+1)+"月"+tempDate.getDate()+"日</div>");
					tempDate.setDate(tempDate.getDate() + 7);
				}
				chart.find('.chart .chart-column, .x-label .ticks').css('width','12.5%');
			} else {
				for (i=0; i <= 6; ++i) {
					chart.find('.chart').append("<div class='chart-column'></div>");
					chart.find('.x-label').append("<div class='ticks'>"+ (tempDate.getMonth()+1)+"月"+tempDate.getDate()+"日"+options.weekDay[i]+"</div>");
					tempDate.setDate(tempDate.getDate() + 1);
				}
				chart.find('.chart .chart-column, .x-label .ticks').css('width','14.2857%');
			}

			chart.find('.chart .chart-column').css('background-image', "repeating-linear-gradient(0deg, #ccc, #ccc 1px, transparent 1px, transparent "+((options.chartHeight - options.xLabelHeight)/count)+"px)");
			chart.find('.chart .chart-column').css('background-size', "100% " + ((options.chartHeight - options.xLabelHeight)/count + 0.8)+"px");

			drawOrders();
		}

		function drawOrders(){
			// colorIndex = [];
			for (i = 0; i <= 7; i++) {
				$.each(ordersInput[i], function(index,value){
					if ($.inArray(value[2], colorIndex) == -1) colorIndex.push(value[2]);
					var color = options.colors[$.inArray(value[2], colorIndex) % options.colors.length];
					var height = (options.chartHeight - options.xLabelHeight) * value[0] / options.ymax;
					var orderId = ' orders-id="' + value[2] + '" ';
					var workload = ' workload="' + value[4] + '" ';
					if (value[3] == 2){
						var bg = 'background-color:'+color;
						var addclass = 'order';
					} else if (value[3] == 1){
						var bg = 'background-image: linear-gradient(-135deg,#fff 25%,'+color+' 25%, '+color+' 50%,#fff 50%, #fff 75%,'+color+' 75%, '+color+');background-size: 8px 8px;';
						var addclass = 'order';
					} else{
						var bg = 'background-image: linear-gradient(-45deg,#fff 25%,'+color+' 25%, '+color+' 50%,#fff 50%, #fff 75%,'+color+' 75%, '+color+');background-size: 8px 8px;';
						var addclass = 'order process-order';
					}
					chart.find(".chart .chart-column:nth-child("+(i+1)+")").append("<div class='"+addclass+"' "+orderId+" style='height:"+height+"px; line-height:"+height+"px; "+bg+"'><span>"+ value[1]+"</span></div>");
				});
			}
			if (processOrdersInput.length > 0){
				$.each(processOrdersInput, function( index, value ) {
					if ($.inArray(value[2], colorIndex) == -1) colorIndex.push(value[2]);
					var color = options.colors[$.inArray(value[2], colorIndex) % options.colors.length];
					var height = (options.chartHeight - options.xLabelHeight) * value[0] / options.ymax;
					var orderId = ' orders-id="' + value[2] + '" ';
					if (value[3] == 2){
						var bg = 'background-color:'+color;
						var addclass = 'order';
					} else if (value[3] == 1){
						var bg = 'background-image: linear-gradient(-135deg,#fff 25%,'+color+' 25%, '+color+' 50%,#fff 50%, #fff 75%,'+color+' 75%, '+color+');background-size: 8px 8px;';
						var addclass = 'order';
					} else{
						var bg = 'background-image: linear-gradient(-45deg,#fff 25%,'+color+' 25%, '+color+' 50%,#fff 50%, #fff 75%,'+color+' 75%, '+color+');background-size: 8px 8px;';
						var addclass = 'order process-order';
					}

					chart.find(".process-orders-chart").append("<div class='"+addclass+"' "+orderId+" style='height:"+height+"px; line-height:"+height+"px; "+bg+"'><span>"+ value[1]+"</span></div>")
				});
			}
		}
		function dropOrder(){
			console.log(ordersInput);
			if ( (dragChart.hasClass('process-orders-chart') && dropChart.hasClass('process-orders-chart')) || (dragChart.hasClass('chart-column') && dropChart.hasClass('chart-column') && dragChart.index() == dropChart.index()) ){
				resetDrop();
				return 0;
			}
			if (dropChart.find(".order[orders-id="+dragItem.attr("orders-id")+"]").length == 1){
				var mergeFlag =  confirm("do you want to merge?");
				if (!mergeFlag) {
					resetDrop();
					return 0;
				}
			}
			if (dragChart.hasClass('process-orders-chart')){
				if (dropChart.hasClass('chart-column')){
					if (mergeFlag){
						var tmp_index = ordersInput[dropChart.index()].findIndex((x) => x[2] == dragItem.attr("orders-id"));
						ordersInput[dropChart.index()][tmp_index][0] +=  processOrdersInput[dragItem.index()][0];
						ordersInput[dropChart.index()][tmp_index][4] +=  processOrdersInput[dragItem.index()][4];
					} else{
						ordersInput[dropChart.index()].push(processOrdersInput[dragItem.index()]);
					}
					processOrdersInput.splice(dragItem.index(), 1);
				}
			} else if(dropChart.hasClass('process-orders-chart')){
				if (mergeFlag){
					var tmp_index = processOrdersInput.findIndex((x) => x[2] == dragItem.attr("orders-id"));
					processOrdersInput[tmp_index][0] += ordersInput[dragChart.index()][dragItem.index()][0];
					processOrdersInput[tmp_index][4] += ordersInput[dragChart.index()][dragItem.index()][4];
				} else{
					processOrdersInput.push(ordersInput[dragChart.index()][dragItem.index()]);
				}
				ordersInput[dragChart.index()].splice([dragItem.index()],1);
			} else{
				if (dragChart.index() != dropChart.index()){
					if (mergeFlag){
						var tmp_index = ordersInput[dropChart.index()].findIndex((x) => x[2] == dragItem.attr("orders-id"));
						ordersInput[dropChart.index()][tmp_index][0] +=  ordersInput[dragChart.index()][dragItem.index()][0];
						ordersInput[dropChart.index()][tmp_index][4] +=  ordersInput[dragChart.index()][dragItem.index()][4];
					} else{
						ordersInput[dropChart.index()].push(ordersInput[dragChart.index()][dragItem.index()]);
					}
					ordersInput[dragChart.index()].splice([dragItem.index()],1);
				}
			}
			resetDrop();
			draw();
		}
		function resetDrop(){
			options.divForDrag.addClass('hide');
			dragItem.removeClass('hide');
			dragItem = false;
			dragFlag = false;
			dropChart = false;
		}

		function setMonday(inputDate){
			monday = inputDate;
			mondayFormat = $.datepicker.formatDate('yymmdd', monday);
		}

		function splitProcessOrder(values){
			$.each(values.reverse(), function( index, value ) {
				var temp = [value * processOrdersInput[dblClickTarget.index()][0] / processOrdersInput[dblClickTarget.index()][4], processOrdersInput[dblClickTarget.index()][1], processOrdersInput[dblClickTarget.index()][2], processOrdersInput[dblClickTarget.index()][3], value];
				processOrdersInput.splice(dblClickTarget.index()+1, 0, temp);
			});
			processOrdersInput.splice(dblClickTarget.index(), 1);
			draw();
		}

	};
})