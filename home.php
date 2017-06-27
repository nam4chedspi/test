<?php
class Controller_Home extends Controller_Rest
{
    public function action_login(){

        //check logged in
        // echo phpinfo();die;
        // Sg_Const::debug(Session::instance(), true);
        if (User::is_authed()){
            Response::redirect('home/index/');
            return;
        }
        $view = View::forge('home/PLH001.php');
        $company_id = Input::post('company_id');
        $employee_num = Input::post('employee_num');
        $password = Input::post('password');
        if ($employee_num !== null){
            if (User::login($company_id, $employee_num, $password)){
                Response::redirect('home/index/');
            }
            $view->set('v_error', array('メールアドレスまたはパスワードが違います。'));
        }
        $view->set('v_company_id', $company_id);
        $view->set('v_employee_num', $employee_num);
        $companies = Arr::assoc_to_keyval(Home::get_companies(), 'id', 'name');
        $view->set('v_companies', $companies);
        
        return Response::forge($view);
    }

    public function post_reset_password(){
        $response = array('success_flg'=>true, 'message'=>'sent');
        $row = User::reset_password(Input::post('company_id'),Input::post('employee_num'));
        if ($row){
            $token = hash('md5', $row['id'].time());
            $unique_id = User::set_reset_password_token($row['id'],$token);
            if($unique_id){
                \Package::load('email');
                $email = \Email::forge();
                $email->from('aloxo@sohga.jp', '生産管理システム');
                $email->to($row['email']);
                $email->subject('パスワード初期化');
                $email->body(Uri::create('home/set_new_password?token=').$token);
                try{
                    $email->send();
                }
                catch(\EmailSendingFailedException $e){
                    $response['success_flg'] = false;
                    $response['message'] = "問題が発生しました、<br>担当者に確認ください。";
                }
                catch(\EmailValidationFailedException $e){
                    $response['success_flg'] = false;
                    $response['message'] = "問題が発生しました、<br>担当者に確認ください。";
                }
                $response['message'] = 'email is sent to:' . $row['email'] . '<br>check mail box in 24h for reset password';
            } else{
                $response['success_flg'] = false;
                $response['message'] = "問題が発生しました、<br>担当者に確認ください。";
            }
        }else{
            $response['success_flg'] = false;
            $response['message'] = "問題が発生しました、<br>担当者に確認ください。";
        }
        $this->response($response);
    }


    public function action_logout()
    {
        if (!User::is_authed()){
            Response::redirect('home/login');
        }
        Session_User::destroy();
        Response::redirect('home/login');
    }

    public function action_index()
    {
        
        //check not yet logged in
        if (!User::is_authed())
        {
            // Response::redirect('home/login');
        }
        $view = View::forge('home/index.php');
        $sess = Session_User::get('company_name');
        $view->set('company_name', $sess);
        return Response::forge($view);
    }

    public function action_set_new_password(){
        $view = View::forge('home/PLH002.php');
        $token = Input::get('token');
        if (empty($token)){
            $view->set('v_invalid_flg',true);
            return Response::forge($view);
        }
        $view->set('v_token',$token);
        $user = User::get_user_by_token($token);
        if (!$user){
            $view->set('v_invalid_flg',true);
            return Response::forge($view);
        }
        $view->set('v_user',$user);
        $password = Input::post('password');
        if ($password){
            $unique_id = User::set_password($user['id'],password_hash($password,PASSWORD_DEFAULT));
            if($unique_id){
                $view->set('v_completed',array('set password completed'));
            }else {
                $view->set('v_error',array('set password failed'));
            }
        }
        return Response::forge($view);
    }
}
?>