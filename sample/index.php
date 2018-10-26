<!DOCTYPE html>
<html>
<head>
	<title></title>
	<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css">
</head>
<body>
	<div class="container">
		<form>
			<div class="form-group">
				<label for="exampleFormControlFile1">Example file input</label>
				<input type="file" class="form-control-file" id="exampleFormControlFile1" onchange="onChange(event)">
			</div>
		</form>
	</div>
</body>
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" ></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" ></script>
<script type="text/javascript" src="../c-uploader.js"></script>
<script type="text/javascript">
	function onChange(event) {
		let cup = new cUploader({
					target:'/receiver.php',
					debug: true
				});

		cup.uploadFileById('#exampleFormControlFile1');
		cup.process();
	}
</script>
</html>