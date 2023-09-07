<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6 col-xl-4">
        <div class="card bg-pattern">

          <div class="card-body p-4">

            <div class="text-center w-75 m-auto">
              <div class="auth-logo">
                <a href="index.html" class="logo logo-dark text-center">
                                            <span class="logo-lg">
                                                <img src="assets/images/logo-dark.png" alt="" height="22">
                                            </span>
                </a>

                <a href="index.html" class="logo logo-light text-center">
                                            <span class="logo-lg">
                                                <img src="assets/images/logo-light.png" alt="" height="22">
                                            </span>
                </a>
              </div>
              <p class="text-muted mb-4 mt-3">Enter your email address and password to access admin panel.</p>
            </div>

            <form action="#">

              <div class="mb-3">
                <label for="emailaddress" class="form-label">Email address</label>
                <input class="form-control" type="email" id="emailaddress" required="" placeholder="Enter your email">
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <div class="input-group input-group-merge">
                  <input type="password" id="password" class="form-control" placeholder="Enter your password">
                  <div class="input-group-text" data-password="false">
                    <span class="password-eye"></span>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" id="checkbox-signin" checked>
                  <label class="form-check-label" for="checkbox-signin">Remember me</label>
                </div>
              </div>

              <div class="text-center d-grid">
                <button class="btn btn-primary" type="submit"> Log In</button>
              </div>

            </form>

            <div class="text-center">
              <h5 class="mt-3 text-muted">Sign in with</h5>
              <ul class="social-list list-inline mt-3 mb-0">
                <li class="list-inline-item">
                  <a href="javascript: void(0);" class="social-list-item border-primary text-primary"><i
                    class="mdi mdi-facebook"></i></a>
                </li>
                <li class="list-inline-item">
                  <a href="javascript: void(0);" class="social-list-item border-danger text-danger"><i
                    class="mdi mdi-google"></i></a>
                </li>
                <li class="list-inline-item">
                  <a href="javascript: void(0);" class="social-list-item border-info text-info"><i
                    class="mdi mdi-twitter"></i></a>
                </li>
                <li class="list-inline-item">
                  <a href="javascript: void(0);" class="social-list-item border-secondary text-secondary"><i
                    class="mdi mdi-github"></i></a>
                </li>
              </ul>
            </div>

          </div> <!-- end card-body -->
        </div>
        <!-- end card -->

        <div class="row mt-3">
          <div class="col-12 text-center">
            <p><a href="auth-recoverpw.html" class="text-white-50 ms-1">Forgot your password?</a></p>
            <p class="text-white-50">Don't have an account? <a href="auth-register.html" class="text-white ms-1"><b>Sign
              Up</b></a></p>
          </div> <!-- end col -->
        </div>
        <!-- end row -->

      </div> <!-- end col -->
    </div>
    <!-- end row -->
  </div>
</template>

<script>

export default {
};
</script>
