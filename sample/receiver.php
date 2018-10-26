<?php

//var_dump($_POST);
//var_dump($_FILES);

$temp_dir = __DIR__ ."/" .$_POST['identifier'];
$dest_file = $temp_dir.'/'.$_POST['filename'].'_part'.$_POST['chunkedNumber'];

// create the temporary directory
if (!is_dir($temp_dir)) {
    mkdir($temp_dir, 0775, true);
}


foreach ($_FILES as $key => $file) {
	if ( move_uploaded_file($file['tmp_name'], $dest_file) ) {
		createFileFromChunks($temp_dir, $_POST['filename'],$_POST['chunkedSize'], $_POST['totalSize'],$_POST['numberChunkedOfFile']);
	} 
}

function createFileFromChunks($temp_dir, $fileName, $chunkSize, $totalSize, $total_files) {

    // count all the parts of this file
    $total_files_on_server_size = 0;
    foreach(scandir($temp_dir) as $file) {
        /*$tempfilesize = filesize($temp_dir.'/'.$file);
        $total_files_on_server_size = $total_files_on_server_size + $tempfilesize;*/
        $total_files_on_server_size++;
    }
    // check that all the parts are present
    // If the Size of all the chunks on the server is equal to the size of the file uploaded.
    if ($total_files_on_server_size >= $total_files) {
    // create the final destination file 
        if (($fp = fopen($temp_dir.'/'.$fileName, 'w+')) != false) {
            for ($i=1; $i<=$total_files; $i++) {
                fwrite($fp, file_get_contents($temp_dir.'/'.$fileName.'_part'.$i));
            }
            fclose($fp);
        } 
    }

}