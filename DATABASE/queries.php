<?php


# Create Account
function createAcc($pdo,$name,$email,$password){
    $stm=$pdo->prepare("INSERT INTO users (name,email,password) VALUES (?,?,?);");
    $stm->execute([$name,$email,$password]);
    return $stm->rowCount();
}
# Get users by Email
function getUser($pdo,$email){
    $stm=$pdo->prepare("SELECT * from users where email=?;");
    $stm->execute([$email]);
    return $stm->fetch();
}

# Submit feedback
function submitFeedback($pdo,$name,$email,$message,$rating){
    $stm=$pdo->prepare("INSERT INTO feedback (name,email,message,rating) VALUES (?,?,?,?);");
    $stm->execute([$name,$email,$message,$rating]);
    return $stm->rowCount();
}
