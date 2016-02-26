$(function(){
	$('.menuBtn, .closeBtn').click(function(){
		$('.lnb').slideToggle('fast');
	});
	$('.menuBack').click(function(){
		history.back();
	});
	$('.copyright').click(function(){
		$('.footerHide').slideToggle('fast', function(){
			window.scrollTo(200, $(window).height());
		});
	});
	$(window).load(function(){
		var winH = ( $(window).height()-60 )/10;
		var boxB = (winH*5) +'px';
		var boxM = (winH*2.5) +'px';
		$('.boxB').css('height', boxB);
		$('.boxM').css('height', boxM);
	});

	$('.contentForm select').click(function(){
		$(this).css('color', '#333');
	})
});