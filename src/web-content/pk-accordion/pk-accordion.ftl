<!--
    Contenedor de contenido. Comparte la escala con el header mediante los
    tokens del Style Book (--container-max-*), de modo que ambos componentes
    alinean sus bordes a partir de 1200px. Antes este bloque no tenia
    contenedor y ocupaba todo el ancho disponible.
-->
<div class="pk-accordion-wrapper pk-container">

    <div class="pk-accordion">

        <#if accordionItems.getSiblings()?has_content>

            <#assign accordions = accordionItems.getSiblings()>
            <#assign total = accordions?size>
            <#assign formattedTotal = total?string("00")>

            <#list accordions as item>

                <article
                    class="pk-accordion-item"
                    data-accordion-item
                    data-open="false"
                >

                    <!-- HEADER -->
                    <div class="pk-accordion-header">

                        <!-- Counter -->
                        <span
                            class="pk-accordion-counter"
                            aria-hidden="true"
                        >
                            ${item?counter?string("00")} / ${formattedTotal}
                        </span>

                        <!-- Title -->
                        <h2 class="pk-accordion-title">
                            ${item.title.getData()}
                        </h2>

                        <!-- Toggle -->
                        <button
                            class="pk-accordion-toggle"
                            type="button"
                            data-accordion-toggle
                            aria-expanded="false"
                            aria-label="Abrir contenido"
                        >
                            <i
                                class="bi bi-x"
                                aria-hidden="true"
                            ></i>
                        </button>

                    </div>

                    <!-- CONTENT -->
                    <div
                        class="pk-accordion-content"
                        data-accordion-panel
                        aria-hidden="true"
                    >

                        <#if item.subtitle.getData()?has_content>
                            <h3 class="pk-accordion-subtitle">
                                ${item.subtitle.getData()}
                            </h3>
                        </#if>

                        <#if item.content.getData()?has_content>
                            <div class="pk-accordion-description">
                                ${item.content.getData()}
                            </div>
                        </#if>

                    </div>

                </article>

            </#list>

        </#if>

    </div>
</div>
