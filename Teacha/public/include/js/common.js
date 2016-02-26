$(function(){
	$('.lnb > li').mouseenter(function(){
		if( !$(this).hasClass('active')){
			$('.lnb li.active ul.snb').stop().slideUp('fast');
		}
		$(this).children('ul.snb:not(:animated)').stop().slideDown('fast');
	}).mouseleave(function(){
		$(this).children('ul.snb').stop().slideUp('fast');
		$('.lnb li.active ul.snb').stop().slideDown('fast');
	});
});