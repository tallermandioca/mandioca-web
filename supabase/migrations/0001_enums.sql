-- Enums and extensions for Taller Mandioca
create extension if not exists pgcrypto;

create type rol_perfil as enum ('cliente', 'admin');
create type tipo_instrumento as enum ('electrica', 'acustica', 'criolla', 'bajo', 'otro');
create type estado_orden as enum ('recibido', 'presupuestado', 'aprobado', 'en_proceso', 'listo', 'entregado', 'cancelado');
create type momento_foto as enum ('antes', 'despues');
create type tipo_recordatorio as enum ('calibracion', 'cuerdas', 'otro');
create type canal_aviso as enum ('whatsapp', 'email');
create type estado_recordatorio as enum ('pendiente', 'enviado', 'pausado', 'cancelado');
create type estado_instrumento_venta as enum ('excelente', 'muy_bueno', 'bueno', 'regular');
create type estado_publicacion as enum ('borrador', 'publicada', 'pausada', 'vendida');
create type tipo_ig_post as enum ('imagen', 'video', 'carrusel');
