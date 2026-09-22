from flask import Flask
from flask_cors import CORS
from app.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)

    from app.routes.member_routes import member_bp
    from app.routes.trainer_routes import trainer_bp
    from app.routes.class_routes import class_bp
    from app.routes.payment_routes import payment_bp
    from app.routes.attendance_routes import attendance_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.booking_routes import booking_bp

    app.register_blueprint(member_bp)
    app.register_blueprint(trainer_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(booking_bp)

    @app.route('/')
    def index():
        return {"message": "Gym Management System API is running"}

    return app